from genericpath import exists
from itertools import count
import sys
import os
import comtypes.client
import shutil

wdFormatPDF = 17

docs = os.listdir(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))) + "/files/" + sys.argv[1])

count =0

for doc in docs:
    in_file = os.path.abspath(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))  + "/files/" + sys.argv[1] + "/" + doc)
    out_file = os.path.abspath(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))  + "/output-files/doctopdf/" + sys.argv[1] + "/" + doc.split(".")[0] + ".pdf")
    word = comtypes.client.CreateObject('Word.Application')
    doc = word.Documents.Open(in_file)
    doc.SaveAs(out_file, FileFormat=wdFormatPDF)
    count +=1
    doc.Close()
    word.Quit()

if count == len(docs):
    shutil.rmtree(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))) + "/files/" + sys.argv[1])

