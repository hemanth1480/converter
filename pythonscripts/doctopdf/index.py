import sys
import os
# import win32com.client
# import comtypes.client
from docx2pdf import convert
import shutil

count = 0

docs = os.listdir(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))) + "/files/" + sys.argv[1])

for doc in docs:
    in_file = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))) +"/files/" + sys.argv[1] + "/" + doc
    out_file = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))  + "/output-files/doctopdf/" + sys.argv[1] + "/" + doc.split(".")[0] + ".pdf"
    convert(in_file,out_file)
    count+=1

if count == len(docs):
    shutil.rmtree(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))) + "/files/" + sys.argv[1])

