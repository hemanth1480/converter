from itertools import count
from PyPDF2 import PdfMerger
import sys
import os
import shutil

merger = PdfMerger()

pdfs = sys.argv[1].split(",")
count = 0

for pdf in pdfs:
    merger.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))) +"/files/" + sys.argv[2] + "/" + pdf)
    count +=1

merger.write(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))) +"/output-files/pdf-merger/" + sys.argv[2] + "/" + "merge.pdf")
merger.close()

if count == len(pdfs):
    shutil.rmtree(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))) + "/files/" + sys.argv[2])