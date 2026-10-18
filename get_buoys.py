#install requests if you don't have it. probably don't need a whole venv for this.
import requests
from institutions import vars_by_institution

baseURL = 'https://data.neracoos.org/erddap/tabledap/'

query = f'{baseURL}allDatasets.json?datasetID,institution'

# try:
data = requests.get(query).json()

# except JSONDecodeError:
#   print('Request for all dataset IDs did not return valid JSON')

dataset_ids = data['table']['rows']
del dataset_ids[0] #get rid of allDatasets to avoid recursive sadness

for pair in dataset_ids:
  print(pair)



