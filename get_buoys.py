#install requests if you don't have it. probably don't need a whole venv for this.
import requests

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

vars_by_institution = [
  {
    'name': 'Physical Oceanography Group, School of Marine Sciences, University of Maine',
    'tempVar': 'temperature',

  },
  {
    'name': 'Virginia Electric and Power Company, d/b/a Dominion Energy Virginia',
    'tempVar': 'WATER_TEMPERATURE',

  },
  {
    'name': 'Empire Wind',
    'tempVar': 'CTD_WTmp',

  },
  {
    'name': "NOAA's Northeast Fisheries Science Center and the Gulf of Maine Lobster Foundation",
    'tempVar': 'std_temp',

  },
  {
    'name': 'Onset Hobolink',
    'tempVar': 'Temp',

  },
  {
    'name': 'Hurricane Island Center for Science and Leadership',
    'tempVar': 'temperature',

  },
  {
    'name': 'Maria Mitchell Association',
    'tempVar': 'temperature',

  },
  {
    'name': 'NOAA NDBC',
    'tempVar': 'WTMP',

  },
  {
    'name': "Stone Living Lab - a partnership between Boston Harbor Now, UMass Boston's School for the Environment, the City of Boston, the Massachusetts Department of Conservation and Recreation, the Massachusetts Executive Office of Energy and Environmental Affairs, the National Park Service, and the James M. and Cathleen D. Stone Foundation",
    'tempVar': 'water_temperature',

  },
  {
    'name': 'South Fork Wind - a partnership between Orsted and Global Infrastructure Partners',
    'tempVar': 'ZCel_WTmp',

  },
  
]

# tempvar_names = [
#   'temperature',
#   'WATER_TEMPERATURE',
#   'CTD_WTmp',
#   'std_temp',
#   'Temp',
#   'WTMP',
#   'water_temperature',
#   'ZCel_WTmp',
# ]
#the real problem is inconsistent water temperature variables
#how do we solve this? well, one way is to get some common names and run
#through them.
#ACTUALLY, there aren't that many institutions doing this.
#could just make a list of institution names w associated variable names,
#iterate thru that against dataset's institution var (if that is consistent lmao)
                                                    #^it IS!
#and just match variables based on that.
#so maybe i really want a list of dictionaries. let's do that.

#if the institution isn't On The List, we ditch it.
#i WONDER if there's a way we can make the query conditional on that list in the first
#place. that might be silly, over-optimizing. don't see anything obv in documentation
#about doing this, let's move on.

#we want: id, label, tempVar, qcVar, depth