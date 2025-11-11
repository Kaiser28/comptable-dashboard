from docx import Document

doc = Document(r"templates\\template-statuts.docx")
for i, para in enumerate(doc.paragraphs, 1):
    text = para.text.strip()
    if text:
        print(f"[{i}] {text}")
