#install requests if you don't have it. probably don't need a whole venv for this.
import requests
from institutions import vars_by_institution

baseURL = 'https://data.neracoos.org/erddap/tabledap/'

id_query = f'{baseURL}allDatasets.json?datasetID,institution'

# try:
data = requests.get(id_query).json()

# except JSONDecodeError:
#   print('Request for all dataset IDs did not return valid JSON')

dataset_ids_by_institution = data['table']['rows']
del dataset_ids_by_institution[0] #get rid of allDatasets to avoid recursive sadness

output = [] #le accumulator

for pair in dataset_ids_by_institution:

  matching_vars = None
  for var_set in vars_by_institution:
    if var_set['institution'] == pair[1]:
      matching_vars = var_set
      break

  if matching_vars == None:
    continue
  working_vars = {k: v for k, v in matching_vars.items() if k != 'institution'}
  print(working_vars)
  #this is cuz of that U of RI group that has 4 different temp qartods
  # print('qcVar' in working_vars)
  # if 'qcVar' in working_vars:
  #   print(type(working_vars['qcVar']))
  if 'qcVar' in working_vars and isinstance(working_vars['qcVar'], list):
    # print('list detected')
    working_vars['qcVar'] = ','.join(working_vars['qcVar'])
  data_query = f"{baseURL}{pair[0]}.json?{','.join(working_vars.values())}"
  print(data_query)
  # buoy_data = {
  #   'id': pair[0],
  #   'institution': pair[1],
  # }

  