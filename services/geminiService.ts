import type { InvoiceData, Airport } from "../types";

// Declare globals from CDN scripts
declare var pdfjsLib: any;
declare var mammoth: any;
declare var XLSX: any;

// Using a CORS proxy to bypass browser security restrictions when calling the self-hosted Ollama API.
// This is necessary because the Ollama server at 'ollama.proofofconcept.pro' is not sending the
// required Access-Control-Allow-Origin header.
const OLLAMA_BASE_URL = 'https://corsproxy.io/?https://ollama.proofofconcept.pro/api';

/**
 * Processes a response from the Ollama API.
 * This handles both standard JSON responses and streaming responses (which return line-separated JSON objects)
 * by aggregating the content from all stream chunks.
 * @param response The fetch Response object.
 * @returns A promise that resolves to the aggregated content as a string.
 */
async function processOllamaResponse(response: Response): Promise<string> {
    const rawText = await response.text();
    
    // Try to parse as single JSON object first (for compliant non-streaming responses)
    try {
        const json = JSON.parse(rawText);
        // For /api/chat
        if (json.message && json.message.content) {
            return json.message.content;
        }
        // For /api/generate
        if (json.response) {
            return json.response;
        }
    } catch (e) {
        // Not a single JSON object, assume it's a stream of line-separated JSON
    }

    const lines = rawText.trim().split('\n');
    let fullContent = '';

    lines.forEach(line => {
        try {
            const chunk = JSON.parse(line);
            // for /api/generate
            if (chunk.response) {
                fullContent += chunk.response;
            } 
            // for /api/chat
            else if (chunk.message && chunk.message.content) {
                fullContent += chunk.message.content;
            }
        } catch (error) {
            console.warn('Could not parse line from Ollama stream:', line);
        }
    });

    return fullContent.trim();
}

const extractTextFromFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = async (event) => {
            try {
                if (file.type.startsWith('text/') || file.name.endsWith('.csv')) {
                    resolve(event.target?.result as string);
                    return;
                }

                const arrayBuffer = event.target?.result as ArrayBuffer;
                if (!arrayBuffer) {
                    return reject(new Error("Could not read file content."));
                }
                
                if (file.type === 'application/pdf') {
                    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                    let fullText = '';
                    for (let i = 1; i <= pdf.numPages; i++) {
                        const page = await pdf.getPage(i);
                        const textContent = await page.getTextContent();
                        fullText += textContent.items.map((item: any) => item.str).join(' ') + '\n';
                    }
                    resolve(fullText);
                } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') { // .docx
                    const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
                    resolve(result.value);
                } else if (
                    file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || // .xlsx
                    file.type === 'application/vnd.ms-excel' // .xls
                ) {
                    const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });
                    let fullText = '';
                    workbook.SheetNames.forEach((sheetName: string) => {
                        const worksheet = workbook.Sheets[sheetName];
                        const csvText = XLSX.utils.sheet_to_csv(worksheet);
                        fullText += `--- Sheet: ${sheetName} ---\n${csvText}\n\n`;
                    });
                    resolve(fullText);
                } else {
                    reject(new Error(`Unsupported file type for text extraction: ${file.type || file.name.split('.').pop()}`));
                }
            } catch (error) {
                console.error(`Error processing file ${file.name}:`, error);
                reject(new Error(`Could not read content from ${file.name}. The file may be corrupt or password-protected.`));
            }
        };

        reader.onerror = () => {
            reject(new Error(`Error reading file: ${reader.error?.message}`));
        };

        if (file.type.startsWith('text/') || file.name.endsWith('.csv')) {
            reader.readAsText(file);
        } else {


            
            reader.readAsArrayBuffer(file);
        }
    });
};

export const extractInvoiceDetails = async (file: File): Promise<InvoiceData> => {
  try {
    // 1. Extract text content from the file (RAG approach)
    const textContent = await extractTextFromFile(file);

    // 2. Create a more robust and descriptive prompt inspired by the user's example.
    const prompt = `
EXTRACT INVOICE DATA AND OUTPUT AS JSON

Analyze the following invoice text and extract ALL information. Output ONLY a valid JSON object. Do not include any text, explanations, or markdown formatting before or after the JSON object.

CRITICAL REQUIREMENTS:
- Count the actual rows in the product table accurately. Do not invent or duplicate products.
- Extract header information precisely: Invoice Number, Date, Currency, and Vendor Name.

JSON SCHEMA TO FOLLOW (fill with ACTUAL data from the invoice text):
{
  "request_owner": "string (email)",
  "vendor_name": "string | null",
  "rsaf_bill": "boolean | null",
  "service_type": "string | null (must be one of: 'hotel', 'insurance', 'catering', 'ground_service')",
  "ht_id": "number | null",
  "ir_id": "boolean | null",
  "cr_id": "boolean | null",
  "gs_id": "boolean | null",
  "fsr_id": "string | null",
  "bill_date": "string (YYYY-MM-DD HH:MM:SS)",
  "reference": "string | null",
  "currency": "string (3-letter ISO code, e.g., 'USD')",
  "bill_attachments": [],
  "payment_terms": "string | null",
  "product_lines": [
    {
      "product_name": "string (English / Arabic if bilingual)",
      "quantity": "number",
      "unit_price": "number",
      "discount": "number (decimal, e.g., 0.0 for 0%)",
      "spa_aircraft_tail_number": "number (0 if not applicable)",
      "tax": "string (e.g., '15%')"
    }
  ],
  "departure_iata": "string | null",
  "departure_icao": "string | null",
  "arrival_iata": "string | null",
  "arrival_icao": "string | null",
  "approver_level1": "48",
  "approver_level2": "number | null",
  "approver_level3": "number | null"
}

IMPORTANT RULES:
- If a value is not found, use a JSON 'null' value where the schema allows it.
- For 'product_lines', if no items are found, you MUST return an empty array: [].
- 'bill_attachments' must be an empty array: [].
- 'bill_date' must be in 'YYYY-MM-DD HH:MM:SS' format. If time is missing, use '00:00:00'.
- The 'request_owner' is always 'ashakoor@algocraft.ai'.
- For 'service_type', if it is "Hotel" use "hotel", for "Insurance" use "insurance", for "Catering" use "catering", and for "Ground Service" use "ground_service".

NOW, ANALYZE THIS INVOICE TEXT AND OUTPUT THE JSON:

--- INVOICE TEXT START ---
${textContent}
--- INVOICE TEXT END ---
`;

    const response = await fetch(`${OLLAMA_BASE_URL}/generate`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: 'llama3.1:latest',
            prompt: prompt,
            // The 'images' key is removed; we are sending the text content in the prompt.
            format: 'json',
            stream: false, 
        }),
    });
    
    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Ollama API request failed: ${response.status} ${response.statusText} - ${errorBody}`);
    }

    const jsonText = await processOllamaResponse(response);

    if (!jsonText) {
        throw new Error("The AI returned an empty response. The document might be unreadable or not an invoice.");
    }

    const cleanedJsonText = jsonText.replace(/^```json\s*|```\s*$/g, '');
    const parsedData = JSON.parse(cleanedJsonText);
    
    // Data Sanitization & Defaulting remains as a safety net.
    const sanitizedData: InvoiceData = {
        request_owner: parsedData.request_owner || 'ashakoor@algocraft.ai',
        vendor_name: parsedData.vendor_name || null,
        rsaf_bill: parsedData.rsaf_bill ?? null,
        service_type: parsedData.service_type || null,
        ht_id: parsedData.ht_id || null,
        ir_id: parsedData.ir_id ?? null,
        cr_id: parsedData.cr_id ?? null,
        gs_id: parsedData.gs_id ?? null,
        fsr_id: parsedData.fsr_id || null,
        bill_date: parsedData.bill_date || new Date().toISOString().slice(0, 19).replace('T', ' '),
        reference: parsedData.reference || `INV-${Date.now()}`,
        currency: parsedData.currency || 'SAR',
        bill_attachments: [{ filename: file.name, mimetype: file.type }],
        payment_terms: parsedData.payment_terms || 'N/A',
        departure_iata: parsedData.departure_iata || null,
        departure_icao: parsedData.departure_icao || null,
        arrival_iata: parsedData.arrival_iata || null,
        arrival_icao: parsedData.arrival_icao || null,
        approver_level1: parsedData.approver_level1 || null,
        approver_level2: parsedData.approver_level2 || null,
        approver_level3: parsedData.approver_level3 || null,
        product_lines: Array.isArray(parsedData.product_lines) ? parsedData.product_lines : [],
    };
    
    return sanitizedData;
  } catch (error) {
    console.error("Error calling Ollama API:", error);
    if (error instanceof Error) {
        if (error.message.includes('JSON')) {
             throw new Error("Failed to parse the AI's response. The document may be complex or corrupted, or the model returned invalid JSON.");
        }
        throw new Error(`AI processing failed: ${error.message}`);
    }
    throw new Error("An unexpected error occurred during AI processing.");
  }
};

export const getQAResponse = async (prompt: string): Promise<string> => {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/chat`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: 'llama3.1:latest',
            messages: [
                { role: 'system', content: 'You are a helpful AI assistant. Format your responses using Markdown for readability. Use headings, lists, bold text, etc., where appropriate.' },
                { role: 'user', content: prompt }
            ],
            stream: false,
        }),
    });

    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Ollama API request failed: ${response.status} ${response.statusText} - ${errorBody}`);
    }
    
    const content = await processOllamaResponse(response);
    return content || "Sorry, I couldn't get a response.";

  } catch (error) {
    console.error("Error calling Ollama API for Q&A:", error);
    if (error instanceof Error) {
      throw new Error(`AI processing failed: ${error.message}`);
    }
    throw new Error("An unexpected error occurred during AI processing.");
  }
};

export const getDocQAResponse = async (prompt: string, file: File): Promise<string> => {
  try {
    const fileContent = await extractTextFromFile(file);
    
    const fullPrompt = `You are a specialized AI assistant for answering questions based on a provided document. Your task is to be precise and stick strictly to the text given to you.

**Instructions:**
1.  Read the 'DOCUMENT CONTENT' carefully.
2.  Analyze the 'USER'S QUESTION'.
3.  Formulate your answer based **ONLY** on the information found within the document. Do not infer, guess, or use any external knowledge.
4.  If the document does not contain the information needed to answer the question, you **must** respond with the exact phrase: "The information to answer this question is not available in the provided document."
5.  Format your answer using Markdown (e.g., lists, bold text) for clarity, but only if it helps in presenting the information from the document.

---
**DOCUMENT CONTENT:**
${fileContent}
---

**USER'S QUESTION:**
${prompt}
---

**YOUR ANSWER:**
`;

    const response = await fetch(`${OLLAMA_BASE_URL}/chat`, {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
      },
      body: JSON.stringify({
          model: 'llama3.1:latest',
          messages: [{ role: 'user', content: fullPrompt }],
          stream: false,
      }),
    });
    
    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Ollama API request failed: ${response.status} ${response.statusText} - ${errorBody}`);
    }

    const content = await processOllamaResponse(response);
    return content || "Sorry, I couldn't get a response based on the document.";

  } catch (error) {
    console.error("Error calling Ollama API for Document Q&A:", error);
    if (error instanceof Error) {
        if (error.message.includes('Unsupported file type') || error.message.includes('Could not read content')) {
            throw error;
        }
      throw new Error(`AI processing failed: ${error.message}`);
    }
    throw new Error("An unexpected error occurred during AI processing.");
  }
};

export const fetchAirports = async (): Promise<Airport[]> => {
  const SOLR_URL = 'https://corsproxy.io/?https://solr.spaero.sa/solr/airport_dev/select?q=*:*&rows=10000';
  const credentials = btoa('solr:solrRocksSPA');

  try {
    const response = await fetch(SOLR_URL, {
      headers: {
        'Authorization': `Basic ${credentials}`
      }
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}: ${response.statusText}`);
    }

    const json = await response.json();
    
    if (!json.response || !Array.isArray(json.response.docs)) {
      throw new Error("Invalid API response format from Solr.");
    }
    
    const airports: Airport[] = json.response.docs.map((doc: any, index: number) => ({
      id: doc.id || `${doc.code?.[0]}-${index}`,
      name: doc.airport_name?.[0] || 'N/A',
      city_en: doc.city?.[0] || 'N/A',
      city_ar: doc.city_ar?.[0] || 'N/A',
      country: doc.country?.[0] || 'N/A',
      iata: doc.code?.[0] || 'N/A',
      icao: doc.airport_code?.[0] || 'N/A',
      region: doc.region?.[0] || 'N/A',
    }));

    return airports;

  } catch (error) {
    console.error("Failed to fetch airports:", error);
    if (error instanceof Error && error.message.includes('Failed to fetch')) {
        throw new Error("Could not connect to the airport database. Please check your network connection or if a VPN is required.");
    }
    throw error;
  }
};