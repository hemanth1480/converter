import sys
import os
import comtypes.client
import shutil

shutil.rmtree(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))) + "/files/" + sys.argv[1])