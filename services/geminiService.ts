


import type { InvoiceData, Airport, Approver } from "../types";

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

Your task is to analyze the following invoice text and extract key information. You must output ONLY a single, valid JSON object. Do not include any text, explanations, or markdown formatting before or after the JSON object.

**CRITICAL RULES FOR VENDOR IDENTIFICATION:**
Your primary goal is to correctly identify the vendor. Follow these steps precisely:
1.  **IDENTIFY THE CUSTOMER:** The customer receiving this invoice is "Saudia Private Aviation" or "SPA". This is NEVER the vendor.
2.  **IDENTIFY THE VENDOR:** The vendor is the company that *issued* the invoice and is legally responsible for it. Their name is often found:
    - At the top of the invoice, possibly as a logo or in large, stylized text (be robust in interpreting this).
    - Near company details like a VAT number, Chamber of Commerce number, website, or bank/payment instructions.
3.  **IGNORE INTERMEDIARIES:** If a company is mentioned as "acting as collection agent" (e.g., Avinode AB), they are a payment intermediary, NOT the vendor. Find the company that provided the actual service.
4.  **FINAL DECISION:** After analyzing all names on the document, choose ONLY the legal entity that issued the invoice as the vendor. If you cannot determine the vendor, set 'vendor_name' to null.

**SERVICE TYPE & ID REQUIREMENTS:**
- 'service_type' must be ONE of: 'hotel', 'insurance', 'catering', 'ground_service'.
- If the invoice text does NOT clearly and explicitly state one of these specific services, you MUST set 'service_type' and all related ID fields ('ht_id', 'ir_id', 'cr_id', 'gs_id') to null. DO NOT guess or default a service type.
- If you identify a 'service_type', you MUST set its corresponding ID and nullify the others:
    - If service_type is 'hotel', 'ht_id' can be a number if found, otherwise null. 'ir_id', 'cr_id', 'gs_id' MUST be null.
    - If service_type is 'insurance', 'ir_id' MUST be true. 'ht_id', 'cr_id', 'gs_id' MUST be null.
    - If service_type is 'catering', 'cr_id' MUST be true. 'ht_id', 'ir_id', 'gs_id' MUST be null.
    - If service_type is 'ground_service', 'gs_id' MUST be true. 'ht_id', 'ir_id', 'cr_id' MUST be null.
- This logic is critical. An invoice must have ONE service identifier if its type is known.

**OTHER CRITICAL REQUIREMENTS:**
- Count the actual rows in the product table accurately. Do not invent or duplicate products.
- Extract header information precisely: Invoice Number, Date, and Currency.

JSON SCHEMA TO FOLLOW (fill with ACTUAL data from the invoice text):
{
  "request_owner": "string (email)",
  "vendor_name": "string | null",
  "rsaf_bill": "boolean | null",
  "service_type": "string | null",
  "ht_id": "number | null",
  "ir_id": "boolean | null",
  "cr_id": "boolean | null",
  "gs_id": "boolean | null",
  "fsr_id": "string | null",
  "bill_date": "string (YYYY-MM-DD HH:MM:SS)",
  "reference": "string | null",
  "currency": "string (Full currency name, e.g., 'US Dollar', 'Saudi Riyal', 'Pound Sterling')",
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
  "approver_level1": "number | null",
  "approver_level2": "number | null",
  "approver_level3": "number | null"
}

IMPORTANT RULES:
- If a value is not found, use a JSON 'null' value where the schema allows it.
- For 'product_lines', if no items are found, you MUST return an empty array: [].
- 'bill_attachments' must be an empty array: [].
- 'bill_date' must be in 'YYYY-MM-DD HH:MM:SS' format. If time is missing, use '00:00:00'.
- For 'currency', provide the full currency name (e.g., 'Pound Sterling' for GBP or £, 'US Dollar' for USD or $, 'Saudi Riyal' for SAR). If no currency is found, default to 'Saudi Riyal'.
- The 'request_owner' is always 'ashakoor@algocraft.ai'.
- The default approver_level1 should be 48 if no specific approver is found in the text.

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
    
    // Data Sanitization: Forcefully convert numeric fields in product_lines to numbers.
    // This prevents "toFixed is not a function" errors if the AI returns numbers as strings.
    const sanitizedProductLines = (Array.isArray(parsedData.product_lines) ? parsedData.product_lines : []).map((item: any) => ({
      ...item,
      quantity: parseFloat(String(item.quantity || 0)),
      unit_price: parseFloat(String(item.unit_price || 0)),
      discount: parseFloat(String(item.discount || 0)),
      spa_aircraft_tail_number: parseInt(String(item.spa_aircraft_tail_number || 0), 10),
    }));

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
        currency: parsedData.currency || 'Saudi Riyal',
        bill_attachments: [{ filename: file.name, mimetype: file.type }],
        payment_terms: parsedData.payment_terms || 'N/A',
        product_lines: sanitizedProductLines,
        departure_iata: parsedData.departure_iata || null,
        departure_icao: parsedData.departure_icao || null,
        arrival_iata: parsedData.arrival_iata || null,
        arrival_icao: parsedData.arrival_icao || null,
        approver_level1: parsedData.approver_level1 || 48,
        approver_level2: parsedData.approver_level2 || null,
        approver_level3: parsedData.approver_level3 || null,
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

export const fetchApprovers = async (level: 1 | 2 | 3): Promise<Approver[]> => {
  const CORS_PROXY = 'https://corsproxy.io/?';
  const API_ENDPOINT = `https://stagefin.spaero.sa/get_bill/approver_level${level}`;
  const API_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjb21wYW55Ijoic3BhIiwicHVycG9zZSI6ImhlbH";

  try {
    const response = await fetch(`${CORS_PROXY}${API_ENDPOINT}`, {
      method: 'POST',
      headers: {
        'Authorization': API_TOKEN,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });
    if (!response.ok) {
        throw new Error(`API request for approvers failed with status ${response.status}`);
    }
    const json = await response.json();
    if (json.status !== 'success' || !Array.isArray(json[`approver_level_${level}`])) {
        throw new Error(`Invalid API response format for approver level ${level}.`);
    }
    return json[`approver_level_${level}`];
  } catch (error) {
    console.error(`Failed to fetch approvers for level ${level}:`, error);
    if (error instanceof Error && error.message.includes('Failed to fetch')) {
        throw new Error(`Could not connect to the approvers API. Please check your network connection.`);
    }
    throw error;
  }
};

const MAX_RETRIES = 3;
const INITIAL_DELAY_MS = 1000;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const fetchAirports = async (): Promise<Airport[]> => {
  const SOLR_URL = 'https://corsproxy.io/?https://solr.spaero.sa/solr/airport_dev/select?q=*:*&rows=10000';
  const credentials = btoa('solr:solrRocksSPA');

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(SOLR_URL, {
        headers: {
          'Authorization': `Basic ${credentials}`
        }
      });

      // If we get a 504, wait and try again (if it's not the last attempt)
      if (response.status === 504 && attempt < MAX_RETRIES) {
          const delayTime = INITIAL_DELAY_MS * Math.pow(2, attempt - 1);
          console.warn(`Attempt ${attempt} failed with 504 Gateway Timeout. Retrying in ${delayTime}ms...`);
          await delay(delayTime);
          continue; // Go to the next attempt in the loop
      }
      
      if (!response.ok) {
        // For other errors (or 504 on the last attempt), fail immediately.
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

      return airports; // Success, exit the function

    } catch (error) {
      console.error(`Failed to fetch airports on attempt ${attempt}:`, error);
      if (attempt === MAX_RETRIES) {
        // After all retries have failed, throw a user-friendly error.
        if (error instanceof Error && (error.message.includes('504') || error.message.includes('Failed to fetch'))) {
             throw new Error("The airport database is currently unavailable (Gateway Timeout). This may be a temporary issue. Please try again in a few moments.");
        }
        throw error; // Re-throw other types of errors
      }
    }
  }

  // This line should theoretically not be reached, but it satisfies TypeScript's need for a return path.
  throw new Error("Failed to fetch airports after multiple retries.");
};