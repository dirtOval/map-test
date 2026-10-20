# NERACOOS Map Test

### What is this? Why did you make this?

I stumbled upon the NERACOOS Mariners' Dashboard ( 
<https://mariners.neracoos.org/>) and thought it was really cool.

The app displays current scientific data transmitted from a bunch of different
buoys around the north Atlantic ocean. If you select a particular buoy you can
view its current data, as well as line graphs showing changes in readings over
given time range for particular fields.

I thought that was awesome, but wished there was a way to view the readings
over time for all the buoys at the same time, instead of having to click back
and forth between individual buoys.

So I made this thing. I picked water temperature as the first field to track,
because it seemed the easiest to visualize.

### How did you make this?

Well first I figured out what libraries to use. I looked at Mariners' dashboard
and found they were using ArcGIS for the map, but it looked like that costs
money so instead I used MapLibre GL. React seemed like an obvious choice for
the front-end because I know how to use it.

From there I had to figure out how Mariners' Dashboard was getting its data.
Turns out it gets it from an ERDDAP server run by NERACOOS, which could be
queried like any old API.

Having learned this, I instructed Claude to build out a simple version of the
project using the libraries above, and visualizing the changes in temperature
with a color ramp, Blue -> Red for Cold -> Hot . Reviewed its code, corrected a
couple errors, wrestled with CORS (inevitably), and eventually got a map with
One Buoy on it. Thanks Claude!

One buoy wasn't going to cut it though, I wanted to see a bunch at once. So I
wrote a Python script to get all the datasetIDs, then get the information I
wanted to get from each dataset. Of course that didn't work, because not every
dataset used the same variables to describe readings. Water temperature could
be "temperature", "WTemp", "water_temperature", "ZCel_WTemp", or half a dozen
others. Worse still, many buoys didn't measure water temperature at all!

This led to lots of poking around the datasets, and I ultimately concluded the
best way to do it was to survey the institutions in the database, and make
dictionaries containing their variables of choice for the fields I wanted. Then
I had my script get all datasetIDs and institutions, and compare them against
my list of institution dictionaries. If the datasetID's institution matched one
in the list, I would assign the correct variables to the datasetID in a new
dictionary, which would get added to the output list. No match, it gets
skipped. The output list ultimately got dumped as a JSON file, which I then fed
to my buoy-fetching script.

### Did that fix it?

Kind of! It got a lot of them right, but two problems emerged.

1.  Some institutions only had some of their buoys measuring water temperature,
    so it would throw 400 errors on the ones that didn't.
2.  Some institutions did not, as I had assumed, have consistent naming schemes
    for their variables between buoys!

So this led to a process of pruning and manual variable entry, but the script
got rid of most of the work.

With that, I was ready to plug all the buoys in! With great anticipation I
plugged buoys.JSON into the buoy fetching script and . . .

### Really Slow Load Time, Also A Ton of Errors

It turns out it's a really bad idea to try and do a ton of API requests all at
once, and also not display the page or any indication it's loading until
they're all done. So I had the map draw first, and made Claude implement a
small concurrency pool to ask for the buoys 4 at a time, and drop them into the
map as they were received. Thanks again Claude!

As for the errors, this stemmed from inconsistent data running into an
inflexible fetch request. Which is to say, some buoys offered a depth reading,
some did not. Some had QARTOD flags to say if the data was good, some did not,
some offered 4 different tests for temperature but only an aggregate score on
all the data. So I needed to have the fetch only ask for the fields each buoy
could provide.

### So is it done?

Absolutely not! Depth isn't displayed at all yet (kind of important for
representing water temperature), and I want to add other data as I can.
Probably wind next. Also a bunch of buoy requests are still throwing 400 or 404
errors. Will keep adding stuff as I can, the deployed version is basically a buggy demo. :)

Speaking of, you can view that version [here!](https://dirtoval.github.io/map-test/)