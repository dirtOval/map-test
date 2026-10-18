#we want: label, tempVar, qcVar, depth
#depth is not present on all buoys, so it's optional.
#if there's no depth stat we'll display a ? so it's not misleading.
#same with qc, optional but can provide it when present.

#possible mistaken assumption:
#institutions might have multiple types of buoys & equipment in the ocean.
#might not have all vars, or (worse) have different var names.
#can test if var present in former case, latter case we'll seeeeeeee
#yep, stone living lab only has water_temperature on one buoy.
vars_by_institution = [
  {
    'institution': 'Physical Oceanography Group, School of Marine Sciences, University of Maine',
    'label': 'station',
    'tempVar': 'temperature',
    'qcVar': 'temperature_qc_agg',
    'depth': 'depth',

  },
  {
    'institution': 'Virginia Electric and Power Company, d/b/a Dominion Energy Virginia',
    'label': 'station',
    'tempVar': 'WATER_TEMPERATURE',

  },
  {
    'institution': 'Empire Wind',
    'label': 'station',
    'tempVar': 'CTD_WTmp',
    'depth': 'depth',

  },
  {
    'institution': "NOAA's Northeast Fisheries Science Center and the Gulf of Maine Lobster Foundation",
    'label': 'vessel',
    'tempVar': 'mean_temp',
    'depth': 'depth',
    #there is a standard deviation on the mean temp. do others have this?
    #also depth range. it's a vessel. makes sense. how much flattening of
    #complexity am i willing to do here?
  },
  {
    'institution': 'Onset Hobolink',
    'label': 'Station',
    'tempVar': 'Temp', #air temp or water temp?
    #qartod stuff here but for tide. this is a tide gauge

  },
  {
    'institution': 'Hurricane Island Center for Science and Leadership',
    'label': 'stationID',
    'tempVar': 'temperature',

  },
  {
    'institution': 'Maria Mitchell Association',
    'label': 'station_name',
    'tempVar': 'temperature',
    'depth': 'depth',
    #the very sickest buoy. no qcVar, but so much else
  },
  {
    'institution': 'NOAA NDBC',
    'label': 'platform_id',
    'tempVar': 'WTMP',
  },
  {
    'institution': "Stone Living Lab - a partnership between Boston Harbor Now, UMass Boston's School for the Environment, the City of Boston, the Massachusetts Department of Conservation and Recreation, the Massachusetts Executive Office of Energy and Environmental Affairs, the National Park Service, and the James M. and Cathleen D. Stone Foundation",
    'label': 'stationID',
    'tempVar': 'water_temperature',

  },
  {
    'institution': 'South Fork Wind - a partnership between Orsted and Global Infrastructure Partners',
    'label': 'station',
    'tempVar': 'ZCel_WTmp',
  },
  {
    'institution': 'University of Maine',
    'label': 'stationID',
    'tempVar': 'temperature',
  },
  {
    'institution': 'University of New England',
    'label': 'stationID',
    'tempVar': 'temperature',
  },
  {
    'institution': 'Ocean Process Analysis Laboratory - University of New Hampshire',
    'label': 'platform',
    'tempVar': 'temperature',
    'qcVar': 'temperature_QARTOD_agg',
    'depth': 'depth',
  },
  {
    'institution': 'Graduate School of Oceanography, Marine Ecosystems Research Laboratory, University of Rhode Island',
    'label': 'Station',
    'tempVar': 'Temp',
    'qcVar': ['Temp_qartod_gross_range_test',
              'Temp_qartod_spike_test',
              'Temp_qartod_flat_line_test',
              'Temp_qartod_rate_of_change_test'],
    'depth': 'Depth',
  },
  #this one doesn't have an aggregate for just temp, and its overall aggregate starts at 4. idk why
  #maybe too much work, but i'm gonna set the qcVar as a list, make it check every one optionally
  #too much work for 1 case? probably, but i don't think i could rely on a single test, or just
  #say 4 is also okay, cuz it can also be 4 naturally, meaning it failed.
  {
    'institution': 'WHOI Sea Grant',
    'label': 'stationID',
    'tempVar': 'temperature',
  },
]

#next time i do this i am 100% making an AI agent do it. this is the kind of stuff they're
#really good at. still, fun to do a lil buoy survey.

# tempvar_institutions = [
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