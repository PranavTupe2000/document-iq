import pytesseract
from PIL import Image

print("Tesseract version:")
print(pytesseract.get_tesseract_version())

img = Image.open("data/raw/rvl_cdip/images/invoice/0000023361.tif")
text = pytesseract.image_to_string(img)

print("OCR OUTPUT:")
print(repr(text))
