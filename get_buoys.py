#install requests if you don't have it. probably don't need a whole venv for this.
import requests
import json
from institutions import vars_by_institution

baseURL = 'https://data.neracoos.org/erddap/tabledap/'

id_query = f'{baseURL}allDatasets.json?datasetID,institution'

# try:
id_req = requests.get(id_query).json()

# except JSONDecodeError:
#   print('Request for all dataset IDs did not return valid JSON')

dataset_ids_by_institution = id_req['table']['rows']
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

  buoy_data = {
    'id': pair[0],
    'institution': matching_vars['institution'],
    'label': matching_vars['label'],
    'tempVar': matching_vars['tempVar'],
  }
  if 'qcVar' in matching_vars:
    buoy_data['qcVar'] = matching_vars['qcVar']
  if 'depth' in matching_vars:
    buoy_data['depth'] = matching_vars['depth']
  
  output.append(buoy_data)
  
# print(output)
with open('buoys.json', 'w') as f:
  json.dump(output, f, indent=2)

  # #don't need institution key value anymore, actually it messes things up
  # working_vars = {k: v for k, v in matching_vars.items() if k != 'institution'}
  
  # #this is cuz of that U of RI group that has 4 different temp qartods
  # if 'qcVar' in working_vars and isinstance(working_vars['qcVar'], list):
  #   working_vars['qcVar'] = ','.join(working_vars['qcVar'])

  # data_query = f"{baseURL}{pair[0]}.json?{','.join(working_vars.values())}"
  # print(data_query)
  # # buoy_data = {
  # #   'id': pair[0],
  # #   'institution': pair[1],
  # # }
  # #need to handle errors here cuz not all buoys are gonna have all properties. i knew it!
  # buoy_req = requests.get(data_query)
  # try:
  #   buoy_req.raise_for_status()
  # except requests.exceptions.HTTPError as err:
  #   # print(f'skipping {pair[0]}: {err}')
  #   continue
  # buoy_data = buoy_req.json()['table']['rows']
  # # print(f'{pair[0]} success')
  # print(buoy_data)
  # break
  
  #THIS WAS ALL GREAT FOR TESTING, HOWEVER, i do not need anything but label and depth.

  #method here is to accumulate all the data then dump it as JSON into a file all at once
  #can load that file into buoys.js