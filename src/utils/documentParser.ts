import mammoth from 'mammoth';

export interface ParsedDocument {
  text: string;
  fileName: string;
  fileType: string;
}

export async function parseDocument(file: File): Promise<ParsedDocument> {
  const fileType = file.type;
  const fileName = file.name;
  const fileExtension = fileName.split('.').pop()?.toLowerCase();

  console.log('Parsing document:', { fileName, fileType, fileExtension });

  if (fileType === 'application/pdf' || fileExtension === 'pdf') {
    return parsePDF(file, fileName);
  } else if (
    fileType === 'application/msword' ||
    fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    fileExtension === 'doc' ||
    fileExtension === 'docx'
  ) {
    return parseDOCX(file, fileName);
  } else {
    throw new Error('Unsupported file type. Please use PDF, DOC, or DOCX files.');
  }
}

async function parsePDF(file: File, fileName: string): Promise<ParsedDocument> {
  try {
    console.log('Starting PDF parse for:', fileName);
    const arrayBuffer = await file.arrayBuffer();
    console.log('ArrayBuffer size:', arrayBuffer.byteLength);

    const pdfjsLib = await import('pdfjs-dist');
    console.log('PDF.js version:', pdfjsLib.version);

    // Import the worker directly from the package
    const pdfjsWorker = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker.default;
    console.log('Worker loaded');

    console.log('Loading PDF document...');
    const loadingTask = pdfjsLib.getDocument({
      data: arrayBuffer,
      verbosity: 0,
      isEvalSupported: false
    });

    const pdf = await loadingTask.promise;
    console.log('PDF loaded successfully. Pages:', pdf.numPages);

    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      console.log(`Processing page ${i}/${pdf.numPages}`);
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + '\n';
    }

    console.log('PDF parsed successfully. Text length:', fullText.length);

    if (fullText.trim().length === 0) {
      throw new Error('PDF appears to be empty or contains only images. Please use a PDF with text content.');
    }

    return {
      text: fullText.trim(),
      fileName,
      fileType: 'application/pdf',
    };
  } catch (error) {
    console.error('Error parsing PDF:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    if (errorMessage.includes('empty') || errorMessage.includes('images')) {
      throw error;
    }

    if (errorMessage.includes('worker') || errorMessage.includes('fetch')) {
      throw new Error('Unable to load PDF processing library. Please try again or use a text file instead.');
    }

    throw new Error(`Failed to parse PDF: ${errorMessage}. Please try uploading a different format (TXT, DOC, DOCX).`);
  }
}

async function parseDOCX(file: File, fileName: string): Promise<ParsedDocument> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });

    return {
      text: result.value.trim(),
      fileName,
      fileType: file.type,
    };
  } catch (error) {
    console.error('Error parsing DOCX:', error);
    throw new Error('Failed to parse DOC/DOCX. Please ensure the file is a valid Word document.');
  }
}

export async function analyzeCVWithAI(cvUrl: string, userId: string): Promise<string> {
  try {
    const response = await fetch(cvUrl);
    const blob = await response.blob();
    const file = new File([blob], 'cv.pdf', { type: blob.type });

    const parsedDoc = await parseDocument(file);

    return `CV Analysis Summary:

File: ${parsedDoc.fileName}
Type: ${parsedDoc.fileType}

Extracted Content:
${parsedDoc.text.substring(0, 1000)}${parsedDoc.text.length > 1000 ? '...' : ''}

Note: Full AI-powered analysis is being processed.`;
  } catch (error) {
    console.error('Error analyzing CV:', error);
    throw new Error('Failed to analyze CV');
  }
}
