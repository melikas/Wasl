import fitz
from pathlib import Path

source = Path("attached_assets/Wasl_1788671805533.pdf")
output = Path(".agents/outputs/wasl-prd")
output.mkdir(parents=True, exist_ok=True)

document = fitz.open(source)
for index in range(document.page_count):
    page = document.load_page(index)
    pixmap = page.get_pixmap(matrix=fitz.Matrix(1.25, 1.25), alpha=False)
    pixmap.save(output / f"page-{index + 1:02d}.png")

print(f"Rendered {document.page_count} pages to {output}")