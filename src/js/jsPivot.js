
(function ($) {
    'use strict';
    var dataKey = 'pivottable',
    defaults = {
        showFooter: false,
        pivotOn: {
            rows: [],
            columns: [],
            values: [],
            filters: []
        }
    },
    templateHelpers = {
        getUniques: function (data, field) {
            var sorted = field.sort ? Array.prototype.slice.call(data).sort(field.sort) : data;
            return distinctValues(sorted, field.key);
        }
    },
    templateData = {
        header: {
            filters: '{{~pivot.filters:f}}<tr><th>{{=f.label||f.key}}</th><th class="pivottable-filter {{=f.type||""}}">{{?f.type==="range"||f.type==="dateRange"}}<a>(All)<div><span>Minimum:</span><input name="min" type="text"/><span>Maximum:</span><input name="max" type="text"/><button data-field="{{=f.key}}">Filter</button></div></a>{{??}}<select{{?f.type==="multi"}} multiple{{?}} data-field="{{=f.key}}"><option value="all">(All)</option>{{~this.utils.getUniques(it, f):v}}<option value="{{=v}}">{{=v}}</option>{{~}}</select>{{?}}</th></tr>{{~}}<tr></tr>',
            labels: '{{?pivot.columns.length>0}}<tr><th>{{=pivot.rows[0].label||pivot.rows[0].key}}</th>{{~this.utils.getUniques(it,pivot.columns[0]):cv}}<th>{{=cv}}</th>{{~}}<th>{{=pivot.values[0].label||pivot.values[0].key}}</th></tr>{{??}}<tr><th>{{=pivot.rows[0].label||pivot.rows[0].key}}</th><th>{{=pivot.values[0].label||pivot.values[0].key}}</th></tr>{{?}}',
            utils: {
                getUniques: templateHelpers.getUniques
            }
        },
        body: {
            node: '{{~Object.keys(it):tlk}}{{?typeof(it[tlk])==="object"}}<tr class="closed header" data-key="{{=tlk}}" data-level="{{=level}}"><td><a></a>{{=tlk}}</td>{{?pivot.values.length > 1}}{{?pivot.columns.length>0}}{{~this.utils.getUniques(data,pivot.columns[0]):cv}}<td></td>{{~}}{{?}}<td></td></tr>{{~pivot.values:v}}<tr class="tail closed" data-level="{{=level}}"><td><span>{{=tlk}}</span>{{=v.label||v.key}}</td>{{?pivot.columns.length>0}}{{~this.utils.getUniques(data,pivot.columns[0]):cv}}<td>{{?it[tlk][cv]}}{{=it[tlk][cv][v.key]}}{{?}}</td>{{~}}<td>{{=it[tlk][v.key]}}</td>{{??}}<td>{{=it[tlk][v.key]}}</td>{{?}}</tr>{{~}}{{??}}{{?pivot.columns.length>0}}{{~this.utils.getUniques(data,pivot.columns[0]):cv}}<td>{{?it[tlk][cv]}}{{=it[tlk][cv][pivot.values[0].key]}}{{?}}</td>{{~}}<td>{{=it[tlk][pivot.values[0].key]}}</td>{{??}}<td>{{=it[tlk][pivot.values[0].key]}}</td>{{?}}</tr>{{?}}{{?}}{{~}}',
            leaves: '{{~Object.keys(it):tlk}}{{?typeof(it[tlk])==="object"}}<tr data-key="{{=tlk}}" data-level="{{=level}}"><td>{{=tlk}}</td>{{?pivot.values.length > 1}}{{?pivot.columns.length>0}}{{~this.utils.getUniques(data,pivot.columns[0]):cv}}<td></td>{{~}}{{?}}<td></td></tr>{{~pivot.values:v}}<tr class="tail closed" data-level="{{=level}}"><td><span>{{=tlk}}</span>{{=v.label||v.key}}</td>{{?pivot.columns.length>0}}{{~this.utils.getUniques(data,pivot.columns[0]):cv}}<td>{{?it[tlk][cv]}}{{=it[tlk][cv][v.key]}}{{?}}</td>{{~}}<td>{{=it[tlk][v.key]}}</td>{{??}}<td>{{=it[tlk][v.key]}}</td>{{?}}</tr>{{~}}{{??}}{{?pivot.columns.length>0}}{{~this.utils.getUniques(data,pivot.columns[0]):cv}}<td>{{?it[tlk][cv]}}{{=it[tlk][cv][pivot.values[0].key]}}{{?}}</td>{{~}}<td>{{=it[tlk][pivot.values[0].key]}}</td>{{??}}<td>{{=it[tlk][pivot.values[0].key]}}</td>{{?}}</tr>{{?}}{{?}}{{~}}',
            utils: {
                getUniques: templateHelpers.getUniques
            }
        },
        footer: {
            totals: '{{~pivot.values:v}}<tr><td>{{=v.label||v.key}}</td>{{?pivot.columns.length>0}}{{~this.utils.getUniques(it,pivot.columns[0]):cv}}<td>{{=v.operation(this.utils.filterByField(it,pivot.columns[0].key,cv))}}</td>{{~}}{{?}}<td>{{=v.operation(it)}}</td></tr>{{~}}',
            utils: {
                filterByField: function (data, field,value) {
                    return data.filter(function (row) {
                        return row[field] === value;
                    });
                },
                getUniques: templateHelpers.getUniques
            }
        }
    },
    templates,
    methods = {
        init: function (options) {
            var templateVars = doT.templateSettings.varname;
            doT.templateSettings.varname = "it,pivot,data,level";
            if (!isdef(templates))
                templates =  compileTemplates(templateData);
            doT.templateSettings.varname = templateVars;

            bind.call(this, dataKey, defaults, options);
            var settings = $(this).data(dataKey).settings;

            if (!isdef(settings.data) || !isdef(settings.pivotOn) || Object.keys(settings.pivotOn).length < 2)
                return $.error("pivottable must be initialized with data and pivot definitions");

            return initData.call(this, settings.data);
        },
        unbind: function () {
            return $(this).each(function () {
                unbind.call(this);
                return this;
            });
        },
        addRow: function (obj) {
            var settings = $(this).data(dataKey).settings,
            i = -1, len = settings.pivotOn.columns.length;
            while (++i < len) {
                if (obj.key === settings.pivotOn.columns[i].key) {
                    $.error("Columns my not exist in both 'row' and 'column' fields.");
                    return this;
                }
            }
            addPivotField.call(this, obj, "rows");
            return this;
        },
        removeRow: function (key) { 
            removePivotField.call(this, key, "rows");
            return this;
        },
        addValue: function (obj) {
            addPivotField.call(this, { key: key, operation: func }, "values");
            return this;
        },
        removeValue: function (key) {
            removePivotField.call(this, key, "values");
            return this;
        },
        addFilter: function (obj) {
            addPivotField.call(this, obj, "filters");
            return this;
        },
        removeFilter: function (key) {
            removePivotField.call(this, key, "filters");
            return this;
        }
    };

    $.fn.pivottable = function (methodOrOptions) {
        var args = arguments;
        if (methods[methodOrOptions]) {
            return this.each(function () { methods[methodOrOptions].apply(this, Array.prototype.slice.call(args, 1)); });
        } else if (typeof methodOrOptions === "object" || !methodOrOptions) {
            return this.each(function () { methods.init.apply(this, args); });
        } else {
            $.error("Method " + methodOrOptions + " does not exist on jQuery.pivottable");
        }
    };

    // utility
    var bind = function (key) {
        var $element = $(this);
        var settings = {};
        Array.prototype.slice.call(arguments, 1).forEach(function (arg) {
            $.extend(true, settings, arg);
        });
        $element.data(key, { settings: settings });
    },
    unbind = function (key) {
        var e = $(this);
        e.removeData(key)
        .removeClass('pivottable');
    },
    isdef = function (val) {
        return typeof val !== 'undefined';
    },
    qsToObj = function (qs) {
        var queryString = {};
        qs.replace(/([^?=&,]+)(=([^&,]*))?/g, function (qMark, name, eq, val) {
            if (typeof val !== 'undefined')
                queryString[name] = val;
        });
        return queryString;
    },
    removeItemsFrom = function (arr, cond) {
        var copy = arr.slice(0), indices;
        if (typeof cond === "number")
            indices = [cond];
        else if (typeof cond === "function")
            indices = indecesOf(arr, cond);
        else
            throw new TypeError("Removal condition must be an integral index or a boolean function");
        indices.forEach(function (i, x) {
            copy.splice(i - x, 1);
        });
        return copy;
    },
    indecesOf = function (arr, fun) {
        var len = arr.length;
        var res = [];
        for (var i = 0; i < len; i++) {
            if (i in arr) {
                var val = arr[i];
                if (fun.call(arr, val, i)) {
                    res.push(i);
                }
            }
        }
        return res;
    },
    indexOf = function (arr, fun) {
        var len = arr.length;
        for (var i = 0; i < len; i++) {
            if (i in arr) {
                var val = arr[i];
                if (fun.call(arr, val, i)) {
                    return i;
                }
            }
        }
        return -1;
    },
    compileTemplates = function (tmpls, results) {
        results = results || {};
        for (var tmpl in tmpls) {
            if (typeof tmpls[tmpl] === "function") {
                results[tmpl] = tmpls[tmpl];
                continue;
            }
            if (typeof tmpls[tmpl] === "object") {
                if (typeof tmpls[tmpl] === "function")
                    results[tmpl] = tmpls[tmpl];
                results[tmpl] = {};
                compileTemplates(tmpls[tmpl],results[tmpl])
                //for (var subTmpl in tmpls[tmpl]) {
                //    if (typeof tmpls[tmpl][subTmpl] === "function") continue;
                //    result[tmpl][subTmpl] =  doT.template(tmpls[tmpl][subTmpl]);
                //}
            } else {
                results[tmpl] = doT.template(tmpls[tmpl]);
            }
        }
        return results;
    },
    // table operations
    initData = function (data) {
        var $table = $(this)
            .addClass('pivottable')
            .html("");
        var settings = $table.data(dataKey).settings;
        var table = settings.tableName;

        if (isdef(table)) {
            table = settings.tableName;
        } else if (Object.keys(data).length > 1 && !isdef(table)) {
            $.error("input data may only represent a single table");
            return this;
        } else {
            table = Object.keys(data)[0];
        }

        $table.attr("data-name", table);
        settings.tableName = table;

        if (data[table].length < 1)
            return this;
        if (typeof data[table][0] !== "object") {
            $.error("Data provided must be an array of objects.");
            return this;
        }

        if (settings.pivotOn.values.length < 1) {
            $.error("At least one 'value' field must be provided.");
            return this;
        }

        if (settings.pivotOn.rows.length < 1) {
            $.error("At least one 'row' field must be provided.");
            return this;
        }

        var i = -1, len = settings.pivotOn.rows.length;
        while (++i < len) {
            if (indexOf(settings.pivotOn.columns, function (column) { return column.key === settings.pivotOn.rows[i].key; }) > -1) {
                $.error("Columns my not exist in both 'row' and 'column' fields.");
                return this;
            }
        }

        data[table] = normalizeData(data[table]);

        $table.append('<thead>');
        renderHeader.call(this, data[table]);
        $table.append('<tbody>');
        renderBody.call(this, data[table]);
        if (settings.showFooter) {
            $table.append('<tfoot>');
            renderFooter.call(this, data[table]);
        }

        return this;
    },
    renderHeader = function (data) {
        var $table = $(this);
        var $head = $table.find('thead');
        var settings = $table.data(dataKey).settings;

        var html = '';
        if (settings.pivotOn.filters.length > 0) {
            html += templates.header.filters(data, settings.pivotOn);
        }
        if (settings.pivotOn.columns.length > 0) {
            var i = -1, len = settings.pivotOn.columns.length, sortColumns = [];
            while (++i < len) {
                if (isdef(settings.pivotOn.columns[i].sort))
                    sortColumns.push({ func: settings.pivotOn.columns[i].sort });
            }
            if (sortColumns.length > 0)
                sortByColumns(Array.prototype.slice.call(data), sortColumns);
        }
        html += templates.header.labels(data, settings.pivotOn);
        var $html = $(html);
        if ($html.find('.pivottable-filter').hasClass('dateRange')) {
            $html.find('button').click(dateRangeFilterChange);
        } else if ($html.find('.pivottable-filter').hasClass('range')) {
            $html.find('button').click(rangeFilterChange);
        } else {
            $html.find('select').change(filterChange);
        }
        $head.html("").append($html);
    },
    renderBody = function (data) {
        onRenderStart.call(this);

        var $table = $(this),
            $body = $table.find('tbody'),
            settings = $table.data(dataKey).settings,
            rowsLength = settings.pivotOn.rows.length,
            i = -1,
            sortColumns = [];

        while (++i < rowsLength) {
            if (isdef(settings.pivotOn.rows[i].sort))
                sortColumns.push({func: settings.pivotOn.rows[i].sort });
        }

        if (sortColumns.length > 0)
            sortByColumns(data, sortColumns);

        var pivotData = transformData(data, settings.pivotOn.rows, settings.pivotOn.values,settings.pivotOn.columns, {});
        settings.pivotData = pivotData;
        
        if (settings.pivotOn.values[0].sort) {
            // TODO: this is WAY too much work to just sort by an aggregate value.
            sortByValues(pivotData, data, settings.pivotOn, settings.pivotOn.rows[0].key);
            settings.pivotData = transformData(data, settings.pivotOn.rows, settings.pivotOn.values, settings.pivotOn.columns, {});
        }
        var $nodes = $(templates.body.node(settings.pivotData, settings.pivotOn, settings.data[settings.tableName], 1));
        if (settings.pivotOn.rows.length > 1) {
            $nodes.find('td > a').click(expandClick);
        } else {
            $nodes.find('td > a').remove();
            if (settings.pivotOn.values.length === 1)
                $nodes.removeClass('header');
        }
        $body.html("");
        $body.append($nodes);

        onRenderEnd.call(this);
    },
    sortByValues = function (pivotData, data, pivot, row) {
        var sortColumns = [];
        pivot.values.forEach(function (value) {
            if (!isdef(value.sort)) return;
            var flattened = flattenData(pivotData, row);
            var order = flattened.sort(value.sort).map(function (val) {
                return val[row];
            });
            sortColumns.push({func: function (a, b) {
                var aIndex = order.indexOf(a[row]),
                    bIndex = order.indexOf(b[row]);
                if (aIndex < 0) aIndex = order.length;
                if (bIndex < 0) bIndex = order.length;

                if (aIndex < 0 || bIndex < 0)
                    return -1;
                if (aIndex > bIndex)
                    return 1;
                else if (aIndex < bIndex)
                    return -1;
                return 0;
            }});
        });
        if (sortColumns.length > 0)
            sortByColumns(data, sortColumns);
    },
    renderFooter = function (data) {
        var $table = $(this),
            settings = $table.data(dataKey).settings;
        if (settings.showFooter)
            $table.find('tfoot').html(templates.footer.totals(data, settings.pivotOn));
    },
    onRenderStart = function () {
        var settings = $(this).data(dataKey).settings;
        if (settings.onRenderStart)
            settings.onRenderStart.call(this);
    },
    onRenderEnd = function () {
        var settings = $(this).data(dataKey).settings;
        if (settings.onRenderEnd)
            settings.onRenderEnd.call(this);
    },
    removePivotField = function (key, field) {
        var settings = $(this).data(dataKey).settings;
        var index = indexOf(settings.pivotOn[field], function (val) {
            return val.key === key;
        });
        if (index > -1) {
            settings.pivotOn[field].splice(index, 1);
            renderHeader.call(this, settings.data[settings.tableName], settings.pivotOn);
            renderBody.call(this, settings.data[settings.tableName], settings.pivotOn);
        }
    },
    addPivotField = function (obj, field) {
        var settings = $(this).data(dataKey).settings;
        var index = indexOf(settings.pivotOn[field], function (val) {
            return val.key === obj.key;
        });
        if (index < 0) {
            settings.pivotOn[field].push(obj);
            renderHeader.call(this, settings.data[settings.tableName], settings.pivotOn);
            renderBody.call(this, settings.data[settings.tableName], settings.pivotOn);
        }
    },
    traverseTo = function (tree, path, step) {
        step = step || 0;
        if (!tree.hasOwnProperty(path[step]))
            return;
        if (!(step + 1 > path.length - 1))
            return traverseTo(tree[path[step]], path, step + 1);
        return tree[path[step]];
    },
    normalizeData = function (data) {
        var columns = Object.keys(data[0]);
        data.forEach(function (row) {
            columns.forEach(function (column) {
                if (row[column] === null)
                    row[column] = "NULL";
            });
        });
        return data;
    },
    transformData = function (data, transformRows, transformValues, transformColumns, topNodes) {
        if (transformRows.length < 1) return topNodes;
        var i = -1, len = transformRows.length;
        while (++i < len) {
            if (isdef(transformRows[i].transform))
                data = transformColumn(data, transformRows[i]);
        }
        var parentColumn = transformRows[0];
        var topNodeNames = distinctValues(data, parentColumn.key);
        topNodeNames.forEach(function (topNodeName) {
            var parentNode = {};
            var filtered = data.filter(function (row) {
                return row[parentColumn.key] === topNodeName;
            });
            transformValues.forEach(function (value) {
                parentNode[value.key] = value.operation(filtered);
            });
            transformColumns.forEach(function (column) {
                var cols = distinctValues(filtered, column.key);
                cols.forEach(function (col) {
                    parentNode[col] = {};
                    var rows = filtered.filter(function (row) {
                        return row[column.key] === col;
                    });
                    transformValues.forEach(function (value) {
                        parentNode[col][value.key] = value.operation(rows);
                    });
                });
            });
            if (transformRows.length > 0) {
                topNodes[topNodeName] = transformData(filtered, transformRows.slice(1), transformValues, transformColumns, parentNode);
            }
        });
        return topNodes;
    },
    transformColumn = function (data, definition) {
        var length = data.length, i = -1;
        while (++i < length) {
            data[i][definition.key] = definition.transform(data[i][definition.key]);
        }
        return data;
    },
    flattenData = function (pivotData, field) {
        var data = [];

        for (var tlk in pivotData) {
            var obj = {};
            obj[field] = tlk;
            for (var slk in pivotData[tlk]) {
                if (typeof pivotData[tlk][slk] === "object") continue;
                obj[slk] = pivotData[tlk][slk];
            }
            data.push(obj);
        }
        return data;
    },
    getPivotField = function(pivot, type,key) {
        return pivot[type].filter(function (val) {
            return val.key === key;
        })[0];
    },
    sortByColumns = function (data, sortColumns) {
        var i = -1, len = sortColumns.length;
        Array.prototype.sort.call(data, function (a, b) {
            var result = 0;
            i = -1;
            while (++i < len) {
                result = sortColumns[i].func(a, b);
                if (result === 0)
                    continue;
            }
            return result;
        });
    },
    distinctValues = function (array, prop) {
        var flags = [], output = [], l = array.length, i;
        for (i = 0; i < l; i++) {
            if (flags[array[i][prop]])
                continue;
            flags[array[i][prop]] = true;
            output.push(array[i][prop]);
        }
        return output;
    },
    distinctObjects = function (array, prop) {
        var flags = [], output = [], l = array.length, i;
        for (i = 0; i < l; i++) {
            if (flags[array[i][prop]])
                continue;
            flags[array[i][prop]] = true;
            output.push(array[i]);
        }
        return output;
    },
    distinct = function (array) {
        var flags = [], output = [], l = array.length, i;
        for (i = 0; i < l; i++) {
            if (flags[array[i]])
                continue;
            flags[array[i]] = true;
            output.push(array[i]);
        }
        return output;
    },
    getPath = function ($row, path) {
        if ($row.attr("data-level") === "1")
            return [$row.attr("data-key")];
        path = path || [];
        var $prev = $row;
        var level = parseInt($prev.attr("data-level"));
        path.push($prev.attr("data-key"));
        while ($prev.attr("data-level") !== "1") {
            var prevLevel = parseInt($prev.attr("data-level"));
            if (prevLevel < level) {
                path.push($prev.attr("data-key"));
                if (prevLevel === 1) {
                    return path.reverse();
                }
            }
            $prev = $prev.prev();
        }
        path.push($prev.attr("data-key"));
        return path.reverse();
    },
    hasLeaves = function (obj) {
        var isLeaf = false;
        var tlks = Object.keys(obj);
        tlks.forEach(function (tlk) {
            if (typeof (obj[tlk]) === "object") {
                var slks = Object.keys(obj[tlk]);
                slks.forEach(function (slk) {
                    if (typeof (obj[tlk][slk]) === "object") {
                        isLeaf = true;
                    }
                });
            }
        });
        return isLeaf;
    },
    expandClick = function () {
        var $self = $(this);
        var $parent = $self.parents('tr')
        if ($parent.hasClass('closed')) {
            var settings = $self.parents('table').data(dataKey).settings,
            path = getPath($parent),
            node = traverseTo(settings.pivotData, path),
            $next;
            if (hasLeaves(node)) {
                $next = $(templates.body.node(node, settings.pivotOn, settings.data[settings.tableName], parseInt($parent.attr("data-level")) + 1));
                $next.find('td > a').click(expandClick);
            } else {
                $next = $(templates.body.leaves(node, settings.pivotOn, settings.data[settings.tableName],parseInt($parent.attr("data-level")) + 1));
            }
            var $tail = $parent.next('.tail');
            while ($tail.length > 0) {
                $tail.toggleClass("closed");
                $tail = $tail.next('.tail')
            }
            $next.insertAfter($parent);
            $parent.toggleClass("closed");
        } else {
            var $row = $parent.next();
            while (parseInt($row.attr("data-level")) > parseInt($parent.attr("data-level"))) {
                var $found = $row;
                $row = $row.next();
                $found.remove();
            }
            var $tail = $parent.next('.tail');
            while ($tail.length > 0) {
                $tail.toggleClass("closed");
                $tail = $tail.next('.tail')
            }
            $parent.toggleClass("closed");
        }
    },
    filterChange = function (e) {
        var $select = $(this);
        var val = getFilterValue($select);
        var settings = $(this).parents('table').data(dataKey).settings;
        var data;
        if (val.length > 1) {
            data = multiFilter(settings.data[settings.tableName], $select.attr('data-field'), val);
        } else if (isdef(val.max) && isdef(val.min)) {

        } else {
            data = val[0] === "all" ? settings.data[settings.tableName] : filterData(settings.data[settings.tableName], $select.attr('data-field'), val[0]);
        }
        renderBody.call($(this).parents('table'), data);
        renderFooter.call($(this).parents('table'), data);
    },
    getFilterValue = function ($elem) {
        var val = $elem.val();
        if (val instanceof Array)
            return val;
        return [val];
    },
    rangeFilterChange = function () {
        var $button = $(this),
            settings = $(this).parents('table').data(dataKey).settings,
            max = $(this).siblings('input[name="max"]').val(),
            min = $(this).siblings('input[name="min"]').val();
        var data = rangeFilter(settings.data[settings.tableName], $button.attr("data-field"), max, min);
        renderBody.call($(this).parents('table'), data);
        renderFooter.call($(this).parents('table'), data);
    },
    dateRangeFilterChange = function () {
        var $button = $(this),
            settings = $(this).parents('table').data(dataKey).settings,
            max = $(this).siblings('input[name="max"]').val(),
            min = $(this).siblings('input[name="min"]').val();
        var data = dateRangeFilter(settings.data[settings.tableName], $button.attr("data-field"), new Date(max), new Date(min));
        renderBody.call($(this).parents('table'), data);
        renderFooter.call($(this).parents('table'), data);
    },
    filterData = function (data, field, value) {
        return data.filter(function (row) {
            return row[field] === value;
        });
    },
    multiFilter = function (data, field, vals) {
        return data.filter(function (row) {
            return vals.indexOf(row[field]) > -1;
        });
    },
    rangeFilter = function (data, field, max, min) {
        return data.filter(function (row) {
            return row[field] > min && row[field] < max;
        });
    },
    dateRangeFilter = function (data, field, max, min) {
        return data.filter(function (row) {
            var date;
            if (/Date\(\d+\)/.test(row[field]))
                date = new Date(parseInt(row[field].substr(6)));
            else
                date = new Date(row[field]);
            return date > min && date < max;
        });
    };
})(jQuery);