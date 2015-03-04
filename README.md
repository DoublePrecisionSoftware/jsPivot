jsPivot
=======

A simple PivotTable jQuery plugin


##Features

* Generates pivot table from tabular data
* Calculates aggregates based on any javascript funciton
* Supports multiple column, row, and filter pivots

##Usage
```html
<table id="myTable"></table>
```

```javascript
$('#myTable').pivottable({
  data: myData,
  pivotOn: myPivot,
  showFooter: true
});
```

## Data

jsPivot requires that the input data be in tablular form, within a parent object

```javascript
var data = {
  "data": [{
    "TrackId":1557,
    "Page":"AMG Chicago Equity Partners Balanced Page",
    "Document":"Document 2",
    "Clicks":1,
    "IPAddress":"38.106.188.182",
    "Browser":"Opera"
  },{
    "TrackId":1558,
    "Page":"AMG Chicago Equity Partners Balanced Page",
    "Document":"Document 2",
    "Clicks":1,
    "IPAddress":"38.106.188.182",
    "Browser":"firefox"
    }]
  };
```

## Pivot definitions

Pivot definitions must contain, at a minimum, a `rows` property and a `values` property.

###Row Definitions

Rows are defined by an array of objects which contain, at a minium, a `key` property,
specifing the column of data to display.

```javascript
var rows = [
  { key: "Document" }
];
```
Rows may also contain a `sort` operation.  A `sort` operation is defined exactly as
a sort function for `Array`s, however, in this sort funciton, the first and second arguments are the appropriate
rows of your table, and the `this` keyword is the current Row definition;

```javascript
function mySortDesc(a, b) {
  return a.MyColumn.localeCompare(b.MyColumn);
}
```

##Values Definitions

Values are defined by an array of objects which contain, at a minium, a `key` property,
specifing the column of data to display, and an `operation` that defines the aggregate
function to perform on the data.

The `operation` function is passed an array of distinct rows based on the `key` 
of the corresponding Row definition.

The value of the `this` keyword within the `operation` function is the current Value
defnition.

```javascript
var values = [
  { key: "Clicks", operation: sumClicks }
];

funtion sumClicks(vals) {
  if (vals.length < 1) return 0;
  return vals.reduce(function (total, cur) {
    return total + cur[this.key];
  });
}
```

##Column definitions

Columns are defined by an array of objects containing, at a minimum, a `key` property
specifiying column of data to pivot on.

```javascript
var columns = [
  { key: "Page" }
];
```

**NOTE:** Currently on a **single column definition** is supported.

##Filter Definitions

Filters are defined by an array of objects which contain, at a minimum, a `key`
property specifiying the column to filter on.

```javascript
var filters = [
  { key: "Browser" }
];
```
Custom filters are coming soon.

##Demo

See the `demo` folder for a full demo of usage.
