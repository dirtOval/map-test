// NERACOOS publishes one ERDDAP dataset per buoy per sensor, so the app needs
// a list of which datasets to pull. Only A01_ocean_002m has been checked against
// its live Data Access Form; add more by looking up each dataset's variable names.
//
// Find candidates (titles, ids, bounding boxes):
// https://data.neracoos.org/erddap/tabledap/allDatasets.htmlTable?datasetID,title,minLongitude,maxLongitude,minLatitude,maxLatitude,maxTime
export const BUOYS = [
  {
    id: "A01_ocean_002m", // A01, Massachusetts Bay, 2 m
    institution:'Physical Oceanography Group, School of Marine Sciences, University of Maine',
    label: "A01 Massachusetts Bay (2 m)",
    tempVar: "temperature", // degree_Celsius
    qcVar: "temperature_qc_agg", // QARTOD aggregate flag, 1 = PASS
    //quality control var!!!! cool.
    depth: 2 //in meters, if buoys use different measurements switch to string.
  },
  // { id: "...", label: "...", tempVar: "...", qcVar: "..." },
];

//we also need to track depth so the visualization is not misleading
