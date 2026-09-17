export interface ParsedResume {
  text: string;
  fileType: "txt" | "pdf" | "docx" | "image";
}

function normalizeText(text: string) {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function parseImageResume(buffer: Buffer, mimeType: string): Promise<string> {
  const apiKey = process.env.IMAGE_OCR_API_KEY || process.env.OPENAI_API_KEY;
  const baseUrl =
    process.env.IMAGE_OCR_BASE_URL || process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
  const model = process.env.IMAGE_OCR_MODEL || "gpt-4o-mini";

  if (!apiKey) {
    throw new Error("图片简历解析需要配置 IMAGE_OCR_API_KEY 或 OPENAI_API_KEY");
  }

  const base64 = buffer.toString("base64");

  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "请从这张简历图片中提取完整文字内容，保留教育经历、项目经历、技能栈、实习经历等结构。只输出简历正文，不要解释。",
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${base64}`,
              },
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`图片简历解析失败: ${errorText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || "";
}


export async function parseResumeFile(file: File): Promise<ParsedResume> {
  const lowerName = file.name.toLowerCase();

  if (lowerName.endsWith(".txt") || lowerName.endsWith(".md")) {
    return { text: normalizeText(await file.text()), fileType: "txt" };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const mimeType = file.type;

  if (mimeType.startsWith("image/")) {
    return {
      text: normalizeText(await parseImageResume(buffer, mimeType)),
      fileType: "image",
    };
  }
  if (lowerName.endsWith(".pdf")) {
    const pdfParse = (await import("pdf-parse")).default;
    const result = await pdfParse(buffer);
    return { text: normalizeText(result.text), fileType: "pdf" };
  }

  if (lowerName.endsWith(".docx")) {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    return { text: normalizeText(result.value), fileType: "docx" };
  }

  throw new Error("仅支持 TXT、PDF 和 DOCX 简历文件");
}
