jsPivot
=======

A simple PivotTable jQuery plugin


##Features

* Generates pivot table from tabular data
* Calculates aggregates based on any javascript function
* Supports multiple row and filter definitions

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

##Data

jsPivot requires that the input data be in tablular form, within a parent property.

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

##Pivot definitions

Pivot definitions must contain, at a minimum, a `rows` property and a `values` property.

```javascript
var pivotDefinition = {
  rows: [
    {
      key: "Document",
      label: "Document Type"
    }
  ],
  values: [
    {
      key: "Clicks",
      label: "Total Clicks",
      operation: sumClicks
    }
  ]
};
```

###Row Definitions

Rows are defined by an array of objects which contain, at a minium, a `key` property specifing the column of data to display.  Optionally, a `label` property may be defined to change the display name of the row.

```javascript
var rows = [{
  key: "Document",
  label: "Document Name",
}];
```

Rows may also contain a `sort` operation.  A `sort` operation is defined exactly as a sort function passed to `Array.prototype.sort`, however, in this sort function, the first and second arguments are the appropriate rows of your table, and the `this` keyword is the current Row Definition.  This allows users to define standard sorting functions, or specialized functions for using other columns.

```javascript
var rows = [{
  key: "Document",
  sort: simpleSort
}];

function simpleSort(a, b) {
  // given the Row Definition above, this.key === "Document"
  return a[this.key].localeCompare(b[this.key]);
}

// you can also access other fields of the row
function sortByPage(a,b) {
  return a.Page.localeCompare(b.Page);
}
```

##Value Definitions

Values are defined by an array of objects which contain, at a minium, a `key` property, specifing the column of data to display, and an `operation` that defines the aggregate function to perform on the data.  

Optionally, a `label` property may be defined to change the display name of the value.

```javascript
var values = [{
  key: "Clicks",
  label: "Click Total",
  operation: sumClicks
}];

funtion sumClicks(vals) {
  var rowDef = this;
  if (vals.length < 1) return 0;
  return vals.reduce(function (total, cur) {
    return total + cur[rowDef.key];
  });
}
```

The `operation` function is passed an array of distinct rows based on the `key`  of the corresponding Row definition.

The value of the `this` keyword within the `operation` function is the current Value defnition.

Values may also contain a `sort` operation.  A `sort` operation is defined exactly as a sort function passed to `Array.prototype.sort`, however, in this sort function, the first and second arguments are the appropriate rows of your table, and the `this` keyword is the current Value definition.  This allows users to define standard sorting functions, or specialized functions for using other columns.

```javascript
var values = [{
  key: "Clicks",
  sort: function(a, b) {
    b.Clicks - a.Clicks
  }
}];
```

**NOTE:** Currently the algorithm for sorting values is incredibly slow.  Sorting based on value for large data sets is not recommended.

##Column definitions

Columns are defined by an array of objects containing, at a minimum, a `key` property specifiying column of data to pivot on.

Optionally, a `label` property may be defined to change the display name of the value.

```javascript
var columns = [{
  key: "Page",
  label: "Page Title",
}];
```

**NOTE:** Currently on a **single column definition** is supported.

Columns may also contain a `sort` operation.  A `sort` operation is defined exactly as a sort function passed to `Array.prototype.sort`, however, in this sort function, the first and second arguments are the appropriate rows of your table, and the `this` keyword is the current Column definition.  This allows users to define standard sorting functions, or specialized functions for using other columns.

```javascript
var columns = [{
  key: "Page",
  sort: simpleSort
}];

function simpleSort(a, b) {
  // given the Column definition above, this.key === "Page"
  return a[this.key].localeCompare(b[this.key]);
}
```

##Filter Definitions

Filters are defined by an array of objects which contain, at a minimum, a `key` property specifiying the column to filter on.

```javascript
var filters = [
  { key: "Browser" }
];
```
Custom filters are coming soon.

##Demo

See the `demo` folder for a full demo of usage.
