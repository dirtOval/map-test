#install requests if you don't have it. probably don't need a whole venv for this.
import requests

baseURL = 'https://data.neracoos.org/erddap/tabledap/'

query = f'{baseURL}allDatasets.json?datasetID'

# try:
data = requests.get(query).json()

# except JSONDecodeError:
#   print('Request for all dataset IDs did not return valid JSON')

dataset_ids = data['table']['rows']
del dataset_ids[0] #get rid of allDatasets to avoid recursive sadness

for id in dataset_ids:
  print(id)