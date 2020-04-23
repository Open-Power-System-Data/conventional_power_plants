(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
//     Underscore.js 1.8.3
//     http://underscorejs.org
//     (c) 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Underscore may be freely distributed under the MIT license.

(function() {

  // Baseline setup
  // --------------

  // Establish the root object, `window` in the browser, or `exports` on the server.
  var root = this;

  // Save the previous value of the `_` variable.
  var previousUnderscore = root._;

  // Save bytes in the minified (but not gzipped) version:
  var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

  // Create quick reference variables for speed access to core prototypes.
  var
    push             = ArrayProto.push,
    slice            = ArrayProto.slice,
    toString         = ObjProto.toString,
    hasOwnProperty   = ObjProto.hasOwnProperty;

  // All **ECMAScript 5** native function implementations that we hope to use
  // are declared here.
  var
    nativeIsArray      = Array.isArray,
    nativeKeys         = Object.keys,
    nativeBind         = FuncProto.bind,
    nativeCreate       = Object.create;

  // Naked function reference for surrogate-prototype-swapping.
  var Ctor = function(){};

  // Create a safe reference to the Underscore object for use below.
  var _ = function(obj) {
    if (obj instanceof _) return obj;
    if (!(this instanceof _)) return new _(obj);
    this._wrapped = obj;
  };

  // Export the Underscore object for **Node.js**, with
  // backwards-compatibility for the old `require()` API. If we're in
  // the browser, add `_` as a global object.
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = _;
    }
    exports._ = _;
  } else {
    root._ = _;
  }

  // Current version.
  _.VERSION = '1.8.3';

  // Internal function that returns an efficient (for current engines) version
  // of the passed-in callback, to be repeatedly applied in other Underscore
  // functions.
  var optimizeCb = function(func, context, argCount) {
    if (context === void 0) return func;
    switch (argCount == null ? 3 : argCount) {
      case 1: return function(value) {
        return func.call(context, value);
      };
      case 2: return function(value, other) {
        return func.call(context, value, other);
      };
      case 3: return function(value, index, collection) {
        return func.call(context, value, index, collection);
      };
      case 4: return function(accumulator, value, index, collection) {
        return func.call(context, accumulator, value, index, collection);
      };
    }
    return function() {
      return func.apply(context, arguments);
    };
  };

  // A mostly-internal function to generate callbacks that can be applied
  // to each element in a collection, returning the desired result — either
  // identity, an arbitrary callback, a property matcher, or a property accessor.
  var cb = function(value, context, argCount) {
    if (value == null) return _.identity;
    if (_.isFunction(value)) return optimizeCb(value, context, argCount);
    if (_.isObject(value)) return _.matcher(value);
    return _.property(value);
  };
  _.iteratee = function(value, context) {
    return cb(value, context, Infinity);
  };

  // An internal function for creating assigner functions.
  var createAssigner = function(keysFunc, undefinedOnly) {
    return function(obj) {
      var length = arguments.length;
      if (length < 2 || obj == null) return obj;
      for (var index = 1; index < length; index++) {
        var source = arguments[index],
            keys = keysFunc(source),
            l = keys.length;
        for (var i = 0; i < l; i++) {
          var key = keys[i];
          if (!undefinedOnly || obj[key] === void 0) obj[key] = source[key];
        }
      }
      return obj;
    };
  };

  // An internal function for creating a new object that inherits from another.
  var baseCreate = function(prototype) {
    if (!_.isObject(prototype)) return {};
    if (nativeCreate) return nativeCreate(prototype);
    Ctor.prototype = prototype;
    var result = new Ctor;
    Ctor.prototype = null;
    return result;
  };

  var property = function(key) {
    return function(obj) {
      return obj == null ? void 0 : obj[key];
    };
  };

  // Helper for collection methods to determine whether a collection
  // should be iterated as an array or as an object
  // Related: http://people.mozilla.org/~jorendorff/es6-draft.html#sec-tolength
  // Avoids a very nasty iOS 8 JIT bug on ARM-64. #2094
  var MAX_ARRAY_INDEX = Math.pow(2, 53) - 1;
  var getLength = property('length');
  var isArrayLike = function(collection) {
    var length = getLength(collection);
    return typeof length == 'number' && length >= 0 && length <= MAX_ARRAY_INDEX;
  };

  // Collection Functions
  // --------------------

  // The cornerstone, an `each` implementation, aka `forEach`.
  // Handles raw objects in addition to array-likes. Treats all
  // sparse array-likes as if they were dense.
  _.each = _.forEach = function(obj, iteratee, context) {
    iteratee = optimizeCb(iteratee, context);
    var i, length;
    if (isArrayLike(obj)) {
      for (i = 0, length = obj.length; i < length; i++) {
        iteratee(obj[i], i, obj);
      }
    } else {
      var keys = _.keys(obj);
      for (i = 0, length = keys.length; i < length; i++) {
        iteratee(obj[keys[i]], keys[i], obj);
      }
    }
    return obj;
  };

  // Return the results of applying the iteratee to each element.
  _.map = _.collect = function(obj, iteratee, context) {
    iteratee = cb(iteratee, context);
    var keys = !isArrayLike(obj) && _.keys(obj),
        length = (keys || obj).length,
        results = Array(length);
    for (var index = 0; index < length; index++) {
      var currentKey = keys ? keys[index] : index;
      results[index] = iteratee(obj[currentKey], currentKey, obj);
    }
    return results;
  };

  // Create a reducing function iterating left or right.
  function createReduce(dir) {
    // Optimized iterator function as using arguments.length
    // in the main function will deoptimize the, see #1991.
    function iterator(obj, iteratee, memo, keys, index, length) {
      for (; index >= 0 && index < length; index += dir) {
        var currentKey = keys ? keys[index] : index;
        memo = iteratee(memo, obj[currentKey], currentKey, obj);
      }
      return memo;
    }

    return function(obj, iteratee, memo, context) {
      iteratee = optimizeCb(iteratee, context, 4);
      var keys = !isArrayLike(obj) && _.keys(obj),
          length = (keys || obj).length,
          index = dir > 0 ? 0 : length - 1;
      // Determine the initial value if none is provided.
      if (arguments.length < 3) {
        memo = obj[keys ? keys[index] : index];
        index += dir;
      }
      return iterator(obj, iteratee, memo, keys, index, length);
    };
  }

  // **Reduce** builds up a single result from a list of values, aka `inject`,
  // or `foldl`.
  _.reduce = _.foldl = _.inject = createReduce(1);

  // The right-associative version of reduce, also known as `foldr`.
  _.reduceRight = _.foldr = createReduce(-1);

  // Return the first value which passes a truth test. Aliased as `detect`.
  _.find = _.detect = function(obj, predicate, context) {
    var key;
    if (isArrayLike(obj)) {
      key = _.findIndex(obj, predicate, context);
    } else {
      key = _.findKey(obj, predicate, context);
    }
    if (key !== void 0 && key !== -1) return obj[key];
  };

  // Return all the elements that pass a truth test.
  // Aliased as `select`.
  _.filter = _.select = function(obj, predicate, context) {
    var results = [];
    predicate = cb(predicate, context);
    _.each(obj, function(value, index, list) {
      if (predicate(value, index, list)) results.push(value);
    });
    return results;
  };

  // Return all the elements for which a truth test fails.
  _.reject = function(obj, predicate, context) {
    return _.filter(obj, _.negate(cb(predicate)), context);
  };

  // Determine whether all of the elements match a truth test.
  // Aliased as `all`.
  _.every = _.all = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var keys = !isArrayLike(obj) && _.keys(obj),
        length = (keys || obj).length;
    for (var index = 0; index < length; index++) {
      var currentKey = keys ? keys[index] : index;
      if (!predicate(obj[currentKey], currentKey, obj)) return false;
    }
    return true;
  };

  // Determine if at least one element in the object matches a truth test.
  // Aliased as `any`.
  _.some = _.any = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var keys = !isArrayLike(obj) && _.keys(obj),
        length = (keys || obj).length;
    for (var index = 0; index < length; index++) {
      var currentKey = keys ? keys[index] : index;
      if (predicate(obj[currentKey], currentKey, obj)) return true;
    }
    return false;
  };

  // Determine if the array or object contains a given item (using `===`).
  // Aliased as `includes` and `include`.
  _.contains = _.includes = _.include = function(obj, item, fromIndex, guard) {
    if (!isArrayLike(obj)) obj = _.values(obj);
    if (typeof fromIndex != 'number' || guard) fromIndex = 0;
    return _.indexOf(obj, item, fromIndex) >= 0;
  };

  // Invoke a method (with arguments) on every item in a collection.
  _.invoke = function(obj, method) {
    var args = slice.call(arguments, 2);
    var isFunc = _.isFunction(method);
    return _.map(obj, function(value) {
      var func = isFunc ? method : value[method];
      return func == null ? func : func.apply(value, args);
    });
  };

  // Convenience version of a common use case of `map`: fetching a property.
  _.pluck = function(obj, key) {
    return _.map(obj, _.property(key));
  };

  // Convenience version of a common use case of `filter`: selecting only objects
  // containing specific `key:value` pairs.
  _.where = function(obj, attrs) {
    return _.filter(obj, _.matcher(attrs));
  };

  // Convenience version of a common use case of `find`: getting the first object
  // containing specific `key:value` pairs.
  _.findWhere = function(obj, attrs) {
    return _.find(obj, _.matcher(attrs));
  };

  // Return the maximum element (or element-based computation).
  _.max = function(obj, iteratee, context) {
    var result = -Infinity, lastComputed = -Infinity,
        value, computed;
    if (iteratee == null && obj != null) {
      obj = isArrayLike(obj) ? obj : _.values(obj);
      for (var i = 0, length = obj.length; i < length; i++) {
        value = obj[i];
        if (value > result) {
          result = value;
        }
      }
    } else {
      iteratee = cb(iteratee, context);
      _.each(obj, function(value, index, list) {
        computed = iteratee(value, index, list);
        if (computed > lastComputed || computed === -Infinity && result === -Infinity) {
          result = value;
          lastComputed = computed;
        }
      });
    }
    return result;
  };

  // Return the minimum element (or element-based computation).
  _.min = function(obj, iteratee, context) {
    var result = Infinity, lastComputed = Infinity,
        value, computed;
    if (iteratee == null && obj != null) {
      obj = isArrayLike(obj) ? obj : _.values(obj);
      for (var i = 0, length = obj.length; i < length; i++) {
        value = obj[i];
        if (value < result) {
          result = value;
        }
      }
    } else {
      iteratee = cb(iteratee, context);
      _.each(obj, function(value, index, list) {
        computed = iteratee(value, index, list);
        if (computed < lastComputed || computed === Infinity && result === Infinity) {
          result = value;
          lastComputed = computed;
        }
      });
    }
    return result;
  };

  // Shuffle a collection, using the modern version of the
  // [Fisher-Yates shuffle](http://en.wikipedia.org/wiki/Fisher–Yates_shuffle).
  _.shuffle = function(obj) {
    var set = isArrayLike(obj) ? obj : _.values(obj);
    var length = set.length;
    var shuffled = Array(length);
    for (var index = 0, rand; index < length; index++) {
      rand = _.random(0, index);
      if (rand !== index) shuffled[index] = shuffled[rand];
      shuffled[rand] = set[index];
    }
    return shuffled;
  };

  // Sample **n** random values from a collection.
  // If **n** is not specified, returns a single random element.
  // The internal `guard` argument allows it to work with `map`.
  _.sample = function(obj, n, guard) {
    if (n == null || guard) {
      if (!isArrayLike(obj)) obj = _.values(obj);
      return obj[_.random(obj.length - 1)];
    }
    return _.shuffle(obj).slice(0, Math.max(0, n));
  };

  // Sort the object's values by a criterion produced by an iteratee.
  _.sortBy = function(obj, iteratee, context) {
    iteratee = cb(iteratee, context);
    return _.pluck(_.map(obj, function(value, index, list) {
      return {
        value: value,
        index: index,
        criteria: iteratee(value, index, list)
      };
    }).sort(function(left, right) {
      var a = left.criteria;
      var b = right.criteria;
      if (a !== b) {
        if (a > b || a === void 0) return 1;
        if (a < b || b === void 0) return -1;
      }
      return left.index - right.index;
    }), 'value');
  };

  // An internal function used for aggregate "group by" operations.
  var group = function(behavior) {
    return function(obj, iteratee, context) {
      var result = {};
      iteratee = cb(iteratee, context);
      _.each(obj, function(value, index) {
        var key = iteratee(value, index, obj);
        behavior(result, value, key);
      });
      return result;
    };
  };

  // Groups the object's values by a criterion. Pass either a string attribute
  // to group by, or a function that returns the criterion.
  _.groupBy = group(function(result, value, key) {
    if (_.has(result, key)) result[key].push(value); else result[key] = [value];
  });

  // Indexes the object's values by a criterion, similar to `groupBy`, but for
  // when you know that your index values will be unique.
  _.indexBy = group(function(result, value, key) {
    result[key] = value;
  });

  // Counts instances of an object that group by a certain criterion. Pass
  // either a string attribute to count by, or a function that returns the
  // criterion.
  _.countBy = group(function(result, value, key) {
    if (_.has(result, key)) result[key]++; else result[key] = 1;
  });

  // Safely create a real, live array from anything iterable.
  _.toArray = function(obj) {
    if (!obj) return [];
    if (_.isArray(obj)) return slice.call(obj);
    if (isArrayLike(obj)) return _.map(obj, _.identity);
    return _.values(obj);
  };

  // Return the number of elements in an object.
  _.size = function(obj) {
    if (obj == null) return 0;
    return isArrayLike(obj) ? obj.length : _.keys(obj).length;
  };

  // Split a collection into two arrays: one whose elements all satisfy the given
  // predicate, and one whose elements all do not satisfy the predicate.
  _.partition = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var pass = [], fail = [];
    _.each(obj, function(value, key, obj) {
      (predicate(value, key, obj) ? pass : fail).push(value);
    });
    return [pass, fail];
  };

  // Array Functions
  // ---------------

  // Get the first element of an array. Passing **n** will return the first N
  // values in the array. Aliased as `head` and `take`. The **guard** check
  // allows it to work with `_.map`.
  _.first = _.head = _.take = function(array, n, guard) {
    if (array == null) return void 0;
    if (n == null || guard) return array[0];
    return _.initial(array, array.length - n);
  };

  // Returns everything but the last entry of the array. Especially useful on
  // the arguments object. Passing **n** will return all the values in
  // the array, excluding the last N.
  _.initial = function(array, n, guard) {
    return slice.call(array, 0, Math.max(0, array.length - (n == null || guard ? 1 : n)));
  };

  // Get the last element of an array. Passing **n** will return the last N
  // values in the array.
  _.last = function(array, n, guard) {
    if (array == null) return void 0;
    if (n == null || guard) return array[array.length - 1];
    return _.rest(array, Math.max(0, array.length - n));
  };

  // Returns everything but the first entry of the array. Aliased as `tail` and `drop`.
  // Especially useful on the arguments object. Passing an **n** will return
  // the rest N values in the array.
  _.rest = _.tail = _.drop = function(array, n, guard) {
    return slice.call(array, n == null || guard ? 1 : n);
  };

  // Trim out all falsy values from an array.
  _.compact = function(array) {
    return _.filter(array, _.identity);
  };

  // Internal implementation of a recursive `flatten` function.
  var flatten = function(input, shallow, strict, startIndex) {
    var output = [], idx = 0;
    for (var i = startIndex || 0, length = getLength(input); i < length; i++) {
      var value = input[i];
      if (isArrayLike(value) && (_.isArray(value) || _.isArguments(value))) {
        //flatten current level of array or arguments object
        if (!shallow) value = flatten(value, shallow, strict);
        var j = 0, len = value.length;
        output.length += len;
        while (j < len) {
          output[idx++] = value[j++];
        }
      } else if (!strict) {
        output[idx++] = value;
      }
    }
    return output;
  };

  // Flatten out an array, either recursively (by default), or just one level.
  _.flatten = function(array, shallow) {
    return flatten(array, shallow, false);
  };

  // Return a version of the array that does not contain the specified value(s).
  _.without = function(array) {
    return _.difference(array, slice.call(arguments, 1));
  };

  // Produce a duplicate-free version of the array. If the array has already
  // been sorted, you have the option of using a faster algorithm.
  // Aliased as `unique`.
  _.uniq = _.unique = function(array, isSorted, iteratee, context) {
    if (!_.isBoolean(isSorted)) {
      context = iteratee;
      iteratee = isSorted;
      isSorted = false;
    }
    if (iteratee != null) iteratee = cb(iteratee, context);
    var result = [];
    var seen = [];
    for (var i = 0, length = getLength(array); i < length; i++) {
      var value = array[i],
          computed = iteratee ? iteratee(value, i, array) : value;
      if (isSorted) {
        if (!i || seen !== computed) result.push(value);
        seen = computed;
      } else if (iteratee) {
        if (!_.contains(seen, computed)) {
          seen.push(computed);
          result.push(value);
        }
      } else if (!_.contains(result, value)) {
        result.push(value);
      }
    }
    return result;
  };

  // Produce an array that contains the union: each distinct element from all of
  // the passed-in arrays.
  _.union = function() {
    return _.uniq(flatten(arguments, true, true));
  };

  // Produce an array that contains every item shared between all the
  // passed-in arrays.
  _.intersection = function(array) {
    var result = [];
    var argsLength = arguments.length;
    for (var i = 0, length = getLength(array); i < length; i++) {
      var item = array[i];
      if (_.contains(result, item)) continue;
      for (var j = 1; j < argsLength; j++) {
        if (!_.contains(arguments[j], item)) break;
      }
      if (j === argsLength) result.push(item);
    }
    return result;
  };

  // Take the difference between one array and a number of other arrays.
  // Only the elements present in just the first array will remain.
  _.difference = function(array) {
    var rest = flatten(arguments, true, true, 1);
    return _.filter(array, function(value){
      return !_.contains(rest, value);
    });
  };

  // Zip together multiple lists into a single array -- elements that share
  // an index go together.
  _.zip = function() {
    return _.unzip(arguments);
  };

  // Complement of _.zip. Unzip accepts an array of arrays and groups
  // each array's elements on shared indices
  _.unzip = function(array) {
    var length = array && _.max(array, getLength).length || 0;
    var result = Array(length);

    for (var index = 0; index < length; index++) {
      result[index] = _.pluck(array, index);
    }
    return result;
  };

  // Converts lists into objects. Pass either a single array of `[key, value]`
  // pairs, or two parallel arrays of the same length -- one of keys, and one of
  // the corresponding values.
  _.object = function(list, values) {
    var result = {};
    for (var i = 0, length = getLength(list); i < length; i++) {
      if (values) {
        result[list[i]] = values[i];
      } else {
        result[list[i][0]] = list[i][1];
      }
    }
    return result;
  };

  // Generator function to create the findIndex and findLastIndex functions
  function createPredicateIndexFinder(dir) {
    return function(array, predicate, context) {
      predicate = cb(predicate, context);
      var length = getLength(array);
      var index = dir > 0 ? 0 : length - 1;
      for (; index >= 0 && index < length; index += dir) {
        if (predicate(array[index], index, array)) return index;
      }
      return -1;
    };
  }

  // Returns the first index on an array-like that passes a predicate test
  _.findIndex = createPredicateIndexFinder(1);
  _.findLastIndex = createPredicateIndexFinder(-1);

  // Use a comparator function to figure out the smallest index at which
  // an object should be inserted so as to maintain order. Uses binary search.
  _.sortedIndex = function(array, obj, iteratee, context) {
    iteratee = cb(iteratee, context, 1);
    var value = iteratee(obj);
    var low = 0, high = getLength(array);
    while (low < high) {
      var mid = Math.floor((low + high) / 2);
      if (iteratee(array[mid]) < value) low = mid + 1; else high = mid;
    }
    return low;
  };

  // Generator function to create the indexOf and lastIndexOf functions
  function createIndexFinder(dir, predicateFind, sortedIndex) {
    return function(array, item, idx) {
      var i = 0, length = getLength(array);
      if (typeof idx == 'number') {
        if (dir > 0) {
            i = idx >= 0 ? idx : Math.max(idx + length, i);
        } else {
            length = idx >= 0 ? Math.min(idx + 1, length) : idx + length + 1;
        }
      } else if (sortedIndex && idx && length) {
        idx = sortedIndex(array, item);
        return array[idx] === item ? idx : -1;
      }
      if (item !== item) {
        idx = predicateFind(slice.call(array, i, length), _.isNaN);
        return idx >= 0 ? idx + i : -1;
      }
      for (idx = dir > 0 ? i : length - 1; idx >= 0 && idx < length; idx += dir) {
        if (array[idx] === item) return idx;
      }
      return -1;
    };
  }

  // Return the position of the first occurrence of an item in an array,
  // or -1 if the item is not included in the array.
  // If the array is large and already in sort order, pass `true`
  // for **isSorted** to use binary search.
  _.indexOf = createIndexFinder(1, _.findIndex, _.sortedIndex);
  _.lastIndexOf = createIndexFinder(-1, _.findLastIndex);

  // Generate an integer Array containing an arithmetic progression. A port of
  // the native Python `range()` function. See
  // [the Python documentation](http://docs.python.org/library/functions.html#range).
  _.range = function(start, stop, step) {
    if (stop == null) {
      stop = start || 0;
      start = 0;
    }
    step = step || 1;

    var length = Math.max(Math.ceil((stop - start) / step), 0);
    var range = Array(length);

    for (var idx = 0; idx < length; idx++, start += step) {
      range[idx] = start;
    }

    return range;
  };

  // Function (ahem) Functions
  // ------------------

  // Determines whether to execute a function as a constructor
  // or a normal function with the provided arguments
  var executeBound = function(sourceFunc, boundFunc, context, callingContext, args) {
    if (!(callingContext instanceof boundFunc)) return sourceFunc.apply(context, args);
    var self = baseCreate(sourceFunc.prototype);
    var result = sourceFunc.apply(self, args);
    if (_.isObject(result)) return result;
    return self;
  };

  // Create a function bound to a given object (assigning `this`, and arguments,
  // optionally). Delegates to **ECMAScript 5**'s native `Function.bind` if
  // available.
  _.bind = function(func, context) {
    if (nativeBind && func.bind === nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
    if (!_.isFunction(func)) throw new TypeError('Bind must be called on a function');
    var args = slice.call(arguments, 2);
    var bound = function() {
      return executeBound(func, bound, context, this, args.concat(slice.call(arguments)));
    };
    return bound;
  };

  // Partially apply a function by creating a version that has had some of its
  // arguments pre-filled, without changing its dynamic `this` context. _ acts
  // as a placeholder, allowing any combination of arguments to be pre-filled.
  _.partial = function(func) {
    var boundArgs = slice.call(arguments, 1);
    var bound = function() {
      var position = 0, length = boundArgs.length;
      var args = Array(length);
      for (var i = 0; i < length; i++) {
        args[i] = boundArgs[i] === _ ? arguments[position++] : boundArgs[i];
      }
      while (position < arguments.length) args.push(arguments[position++]);
      return executeBound(func, bound, this, this, args);
    };
    return bound;
  };

  // Bind a number of an object's methods to that object. Remaining arguments
  // are the method names to be bound. Useful for ensuring that all callbacks
  // defined on an object belong to it.
  _.bindAll = function(obj) {
    var i, length = arguments.length, key;
    if (length <= 1) throw new Error('bindAll must be passed function names');
    for (i = 1; i < length; i++) {
      key = arguments[i];
      obj[key] = _.bind(obj[key], obj);
    }
    return obj;
  };

  // Memoize an expensive function by storing its results.
  _.memoize = function(func, hasher) {
    var memoize = function(key) {
      var cache = memoize.cache;
      var address = '' + (hasher ? hasher.apply(this, arguments) : key);
      if (!_.has(cache, address)) cache[address] = func.apply(this, arguments);
      return cache[address];
    };
    memoize.cache = {};
    return memoize;
  };

  // Delays a function for the given number of milliseconds, and then calls
  // it with the arguments supplied.
  _.delay = function(func, wait) {
    var args = slice.call(arguments, 2);
    return setTimeout(function(){
      return func.apply(null, args);
    }, wait);
  };

  // Defers a function, scheduling it to run after the current call stack has
  // cleared.
  _.defer = _.partial(_.delay, _, 1);

  // Returns a function, that, when invoked, will only be triggered at most once
  // during a given window of time. Normally, the throttled function will run
  // as much as it can, without ever going more than once per `wait` duration;
  // but if you'd like to disable the execution on the leading edge, pass
  // `{leading: false}`. To disable execution on the trailing edge, ditto.
  _.throttle = function(func, wait, options) {
    var context, args, result;
    var timeout = null;
    var previous = 0;
    if (!options) options = {};
    var later = function() {
      previous = options.leading === false ? 0 : _.now();
      timeout = null;
      result = func.apply(context, args);
      if (!timeout) context = args = null;
    };
    return function() {
      var now = _.now();
      if (!previous && options.leading === false) previous = now;
      var remaining = wait - (now - previous);
      context = this;
      args = arguments;
      if (remaining <= 0 || remaining > wait) {
        if (timeout) {
          clearTimeout(timeout);
          timeout = null;
        }
        previous = now;
        result = func.apply(context, args);
        if (!timeout) context = args = null;
      } else if (!timeout && options.trailing !== false) {
        timeout = setTimeout(later, remaining);
      }
      return result;
    };
  };

  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds. If `immediate` is passed, trigger the function on the
  // leading edge, instead of the trailing.
  _.debounce = function(func, wait, immediate) {
    var timeout, args, context, timestamp, result;

    var later = function() {
      var last = _.now() - timestamp;

      if (last < wait && last >= 0) {
        timeout = setTimeout(later, wait - last);
      } else {
        timeout = null;
        if (!immediate) {
          result = func.apply(context, args);
          if (!timeout) context = args = null;
        }
      }
    };

    return function() {
      context = this;
      args = arguments;
      timestamp = _.now();
      var callNow = immediate && !timeout;
      if (!timeout) timeout = setTimeout(later, wait);
      if (callNow) {
        result = func.apply(context, args);
        context = args = null;
      }

      return result;
    };
  };

  // Returns the first function passed as an argument to the second,
  // allowing you to adjust arguments, run code before and after, and
  // conditionally execute the original function.
  _.wrap = function(func, wrapper) {
    return _.partial(wrapper, func);
  };

  // Returns a negated version of the passed-in predicate.
  _.negate = function(predicate) {
    return function() {
      return !predicate.apply(this, arguments);
    };
  };

  // Returns a function that is the composition of a list of functions, each
  // consuming the return value of the function that follows.
  _.compose = function() {
    var args = arguments;
    var start = args.length - 1;
    return function() {
      var i = start;
      var result = args[start].apply(this, arguments);
      while (i--) result = args[i].call(this, result);
      return result;
    };
  };

  // Returns a function that will only be executed on and after the Nth call.
  _.after = function(times, func) {
    return function() {
      if (--times < 1) {
        return func.apply(this, arguments);
      }
    };
  };

  // Returns a function that will only be executed up to (but not including) the Nth call.
  _.before = function(times, func) {
    var memo;
    return function() {
      if (--times > 0) {
        memo = func.apply(this, arguments);
      }
      if (times <= 1) func = null;
      return memo;
    };
  };

  // Returns a function that will be executed at most one time, no matter how
  // often you call it. Useful for lazy initialization.
  _.once = _.partial(_.before, 2);

  // Object Functions
  // ----------------

  // Keys in IE < 9 that won't be iterated by `for key in ...` and thus missed.
  var hasEnumBug = !{toString: null}.propertyIsEnumerable('toString');
  var nonEnumerableProps = ['valueOf', 'isPrototypeOf', 'toString',
                      'propertyIsEnumerable', 'hasOwnProperty', 'toLocaleString'];

  function collectNonEnumProps(obj, keys) {
    var nonEnumIdx = nonEnumerableProps.length;
    var constructor = obj.constructor;
    var proto = (_.isFunction(constructor) && constructor.prototype) || ObjProto;

    // Constructor is a special case.
    var prop = 'constructor';
    if (_.has(obj, prop) && !_.contains(keys, prop)) keys.push(prop);

    while (nonEnumIdx--) {
      prop = nonEnumerableProps[nonEnumIdx];
      if (prop in obj && obj[prop] !== proto[prop] && !_.contains(keys, prop)) {
        keys.push(prop);
      }
    }
  }

  // Retrieve the names of an object's own properties.
  // Delegates to **ECMAScript 5**'s native `Object.keys`
  _.keys = function(obj) {
    if (!_.isObject(obj)) return [];
    if (nativeKeys) return nativeKeys(obj);
    var keys = [];
    for (var key in obj) if (_.has(obj, key)) keys.push(key);
    // Ahem, IE < 9.
    if (hasEnumBug) collectNonEnumProps(obj, keys);
    return keys;
  };

  // Retrieve all the property names of an object.
  _.allKeys = function(obj) {
    if (!_.isObject(obj)) return [];
    var keys = [];
    for (var key in obj) keys.push(key);
    // Ahem, IE < 9.
    if (hasEnumBug) collectNonEnumProps(obj, keys);
    return keys;
  };

  // Retrieve the values of an object's properties.
  _.values = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var values = Array(length);
    for (var i = 0; i < length; i++) {
      values[i] = obj[keys[i]];
    }
    return values;
  };

  // Returns the results of applying the iteratee to each element of the object
  // In contrast to _.map it returns an object
  _.mapObject = function(obj, iteratee, context) {
    iteratee = cb(iteratee, context);
    var keys =  _.keys(obj),
          length = keys.length,
          results = {},
          currentKey;
      for (var index = 0; index < length; index++) {
        currentKey = keys[index];
        results[currentKey] = iteratee(obj[currentKey], currentKey, obj);
      }
      return results;
  };

  // Convert an object into a list of `[key, value]` pairs.
  _.pairs = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var pairs = Array(length);
    for (var i = 0; i < length; i++) {
      pairs[i] = [keys[i], obj[keys[i]]];
    }
    return pairs;
  };

  // Invert the keys and values of an object. The values must be serializable.
  _.invert = function(obj) {
    var result = {};
    var keys = _.keys(obj);
    for (var i = 0, length = keys.length; i < length; i++) {
      result[obj[keys[i]]] = keys[i];
    }
    return result;
  };

  // Return a sorted list of the function names available on the object.
  // Aliased as `methods`
  _.functions = _.methods = function(obj) {
    var names = [];
    for (var key in obj) {
      if (_.isFunction(obj[key])) names.push(key);
    }
    return names.sort();
  };

  // Extend a given object with all the properties in passed-in object(s).
  _.extend = createAssigner(_.allKeys);

  // Assigns a given object with all the own properties in the passed-in object(s)
  // (https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object/assign)
  _.extendOwn = _.assign = createAssigner(_.keys);

  // Returns the first key on an object that passes a predicate test
  _.findKey = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var keys = _.keys(obj), key;
    for (var i = 0, length = keys.length; i < length; i++) {
      key = keys[i];
      if (predicate(obj[key], key, obj)) return key;
    }
  };

  // Return a copy of the object only containing the whitelisted properties.
  _.pick = function(object, oiteratee, context) {
    var result = {}, obj = object, iteratee, keys;
    if (obj == null) return result;
    if (_.isFunction(oiteratee)) {
      keys = _.allKeys(obj);
      iteratee = optimizeCb(oiteratee, context);
    } else {
      keys = flatten(arguments, false, false, 1);
      iteratee = function(value, key, obj) { return key in obj; };
      obj = Object(obj);
    }
    for (var i = 0, length = keys.length; i < length; i++) {
      var key = keys[i];
      var value = obj[key];
      if (iteratee(value, key, obj)) result[key] = value;
    }
    return result;
  };

   // Return a copy of the object without the blacklisted properties.
  _.omit = function(obj, iteratee, context) {
    if (_.isFunction(iteratee)) {
      iteratee = _.negate(iteratee);
    } else {
      var keys = _.map(flatten(arguments, false, false, 1), String);
      iteratee = function(value, key) {
        return !_.contains(keys, key);
      };
    }
    return _.pick(obj, iteratee, context);
  };

  // Fill in a given object with default properties.
  _.defaults = createAssigner(_.allKeys, true);

  // Creates an object that inherits from the given prototype object.
  // If additional properties are provided then they will be added to the
  // created object.
  _.create = function(prototype, props) {
    var result = baseCreate(prototype);
    if (props) _.extendOwn(result, props);
    return result;
  };

  // Create a (shallow-cloned) duplicate of an object.
  _.clone = function(obj) {
    if (!_.isObject(obj)) return obj;
    return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
  };

  // Invokes interceptor with the obj, and then returns obj.
  // The primary purpose of this method is to "tap into" a method chain, in
  // order to perform operations on intermediate results within the chain.
  _.tap = function(obj, interceptor) {
    interceptor(obj);
    return obj;
  };

  // Returns whether an object has a given set of `key:value` pairs.
  _.isMatch = function(object, attrs) {
    var keys = _.keys(attrs), length = keys.length;
    if (object == null) return !length;
    var obj = Object(object);
    for (var i = 0; i < length; i++) {
      var key = keys[i];
      if (attrs[key] !== obj[key] || !(key in obj)) return false;
    }
    return true;
  };


  // Internal recursive comparison function for `isEqual`.
  var eq = function(a, b, aStack, bStack) {
    // Identical objects are equal. `0 === -0`, but they aren't identical.
    // See the [Harmony `egal` proposal](http://wiki.ecmascript.org/doku.php?id=harmony:egal).
    if (a === b) return a !== 0 || 1 / a === 1 / b;
    // A strict comparison is necessary because `null == undefined`.
    if (a == null || b == null) return a === b;
    // Unwrap any wrapped objects.
    if (a instanceof _) a = a._wrapped;
    if (b instanceof _) b = b._wrapped;
    // Compare `[[Class]]` names.
    var className = toString.call(a);
    if (className !== toString.call(b)) return false;
    switch (className) {
      // Strings, numbers, regular expressions, dates, and booleans are compared by value.
      case '[object RegExp]':
      // RegExps are coerced to strings for comparison (Note: '' + /a/i === '/a/i')
      case '[object String]':
        // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
        // equivalent to `new String("5")`.
        return '' + a === '' + b;
      case '[object Number]':
        // `NaN`s are equivalent, but non-reflexive.
        // Object(NaN) is equivalent to NaN
        if (+a !== +a) return +b !== +b;
        // An `egal` comparison is performed for other numeric values.
        return +a === 0 ? 1 / +a === 1 / b : +a === +b;
      case '[object Date]':
      case '[object Boolean]':
        // Coerce dates and booleans to numeric primitive values. Dates are compared by their
        // millisecond representations. Note that invalid dates with millisecond representations
        // of `NaN` are not equivalent.
        return +a === +b;
    }

    var areArrays = className === '[object Array]';
    if (!areArrays) {
      if (typeof a != 'object' || typeof b != 'object') return false;

      // Objects with different constructors are not equivalent, but `Object`s or `Array`s
      // from different frames are.
      var aCtor = a.constructor, bCtor = b.constructor;
      if (aCtor !== bCtor && !(_.isFunction(aCtor) && aCtor instanceof aCtor &&
                               _.isFunction(bCtor) && bCtor instanceof bCtor)
                          && ('constructor' in a && 'constructor' in b)) {
        return false;
      }
    }
    // Assume equality for cyclic structures. The algorithm for detecting cyclic
    // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.

    // Initializing stack of traversed objects.
    // It's done here since we only need them for objects and arrays comparison.
    aStack = aStack || [];
    bStack = bStack || [];
    var length = aStack.length;
    while (length--) {
      // Linear search. Performance is inversely proportional to the number of
      // unique nested structures.
      if (aStack[length] === a) return bStack[length] === b;
    }

    // Add the first object to the stack of traversed objects.
    aStack.push(a);
    bStack.push(b);

    // Recursively compare objects and arrays.
    if (areArrays) {
      // Compare array lengths to determine if a deep comparison is necessary.
      length = a.length;
      if (length !== b.length) return false;
      // Deep compare the contents, ignoring non-numeric properties.
      while (length--) {
        if (!eq(a[length], b[length], aStack, bStack)) return false;
      }
    } else {
      // Deep compare objects.
      var keys = _.keys(a), key;
      length = keys.length;
      // Ensure that both objects contain the same number of properties before comparing deep equality.
      if (_.keys(b).length !== length) return false;
      while (length--) {
        // Deep compare each member
        key = keys[length];
        if (!(_.has(b, key) && eq(a[key], b[key], aStack, bStack))) return false;
      }
    }
    // Remove the first object from the stack of traversed objects.
    aStack.pop();
    bStack.pop();
    return true;
  };

  // Perform a deep comparison to check if two objects are equal.
  _.isEqual = function(a, b) {
    return eq(a, b);
  };

  // Is a given array, string, or object empty?
  // An "empty" object has no enumerable own-properties.
  _.isEmpty = function(obj) {
    if (obj == null) return true;
    if (isArrayLike(obj) && (_.isArray(obj) || _.isString(obj) || _.isArguments(obj))) return obj.length === 0;
    return _.keys(obj).length === 0;
  };

  // Is a given value a DOM element?
  _.isElement = function(obj) {
    return !!(obj && obj.nodeType === 1);
  };

  // Is a given value an array?
  // Delegates to ECMA5's native Array.isArray
  _.isArray = nativeIsArray || function(obj) {
    return toString.call(obj) === '[object Array]';
  };

  // Is a given variable an object?
  _.isObject = function(obj) {
    var type = typeof obj;
    return type === 'function' || type === 'object' && !!obj;
  };

  // Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp, isError.
  _.each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp', 'Error'], function(name) {
    _['is' + name] = function(obj) {
      return toString.call(obj) === '[object ' + name + ']';
    };
  });

  // Define a fallback version of the method in browsers (ahem, IE < 9), where
  // there isn't any inspectable "Arguments" type.
  if (!_.isArguments(arguments)) {
    _.isArguments = function(obj) {
      return _.has(obj, 'callee');
    };
  }

  // Optimize `isFunction` if appropriate. Work around some typeof bugs in old v8,
  // IE 11 (#1621), and in Safari 8 (#1929).
  if (typeof /./ != 'function' && typeof Int8Array != 'object') {
    _.isFunction = function(obj) {
      return typeof obj == 'function' || false;
    };
  }

  // Is a given object a finite number?
  _.isFinite = function(obj) {
    return isFinite(obj) && !isNaN(parseFloat(obj));
  };

  // Is the given value `NaN`? (NaN is the only number which does not equal itself).
  _.isNaN = function(obj) {
    return _.isNumber(obj) && obj !== +obj;
  };

  // Is a given value a boolean?
  _.isBoolean = function(obj) {
    return obj === true || obj === false || toString.call(obj) === '[object Boolean]';
  };

  // Is a given value equal to null?
  _.isNull = function(obj) {
    return obj === null;
  };

  // Is a given variable undefined?
  _.isUndefined = function(obj) {
    return obj === void 0;
  };

  // Shortcut function for checking if an object has a given property directly
  // on itself (in other words, not on a prototype).
  _.has = function(obj, key) {
    return obj != null && hasOwnProperty.call(obj, key);
  };

  // Utility Functions
  // -----------------

  // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
  // previous owner. Returns a reference to the Underscore object.
  _.noConflict = function() {
    root._ = previousUnderscore;
    return this;
  };

  // Keep the identity function around for default iteratees.
  _.identity = function(value) {
    return value;
  };

  // Predicate-generating functions. Often useful outside of Underscore.
  _.constant = function(value) {
    return function() {
      return value;
    };
  };

  _.noop = function(){};

  _.property = property;

  // Generates a function for a given object that returns a given property.
  _.propertyOf = function(obj) {
    return obj == null ? function(){} : function(key) {
      return obj[key];
    };
  };

  // Returns a predicate for checking whether an object has a given set of
  // `key:value` pairs.
  _.matcher = _.matches = function(attrs) {
    attrs = _.extendOwn({}, attrs);
    return function(obj) {
      return _.isMatch(obj, attrs);
    };
  };

  // Run a function **n** times.
  _.times = function(n, iteratee, context) {
    var accum = Array(Math.max(0, n));
    iteratee = optimizeCb(iteratee, context, 1);
    for (var i = 0; i < n; i++) accum[i] = iteratee(i);
    return accum;
  };

  // Return a random integer between min and max (inclusive).
  _.random = function(min, max) {
    if (max == null) {
      max = min;
      min = 0;
    }
    return min + Math.floor(Math.random() * (max - min + 1));
  };

  // A (possibly faster) way to get the current timestamp as an integer.
  _.now = Date.now || function() {
    return new Date().getTime();
  };

   // List of HTML entities for escaping.
  var escapeMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '`': '&#x60;'
  };
  var unescapeMap = _.invert(escapeMap);

  // Functions for escaping and unescaping strings to/from HTML interpolation.
  var createEscaper = function(map) {
    var escaper = function(match) {
      return map[match];
    };
    // Regexes for identifying a key that needs to be escaped
    var source = '(?:' + _.keys(map).join('|') + ')';
    var testRegexp = RegExp(source);
    var replaceRegexp = RegExp(source, 'g');
    return function(string) {
      string = string == null ? '' : '' + string;
      return testRegexp.test(string) ? string.replace(replaceRegexp, escaper) : string;
    };
  };
  _.escape = createEscaper(escapeMap);
  _.unescape = createEscaper(unescapeMap);

  // If the value of the named `property` is a function then invoke it with the
  // `object` as context; otherwise, return it.
  _.result = function(object, property, fallback) {
    var value = object == null ? void 0 : object[property];
    if (value === void 0) {
      value = fallback;
    }
    return _.isFunction(value) ? value.call(object) : value;
  };

  // Generate a unique integer id (unique within the entire client session).
  // Useful for temporary DOM ids.
  var idCounter = 0;
  _.uniqueId = function(prefix) {
    var id = ++idCounter + '';
    return prefix ? prefix + id : id;
  };

  // By default, Underscore uses ERB-style template delimiters, change the
  // following template settings to use alternative delimiters.
  _.templateSettings = {
    evaluate    : /<%([\s\S]+?)%>/g,
    interpolate : /<%=([\s\S]+?)%>/g,
    escape      : /<%-([\s\S]+?)%>/g
  };

  // When customizing `templateSettings`, if you don't want to define an
  // interpolation, evaluation or escaping regex, we need one that is
  // guaranteed not to match.
  var noMatch = /(.)^/;

  // Certain characters need to be escaped so that they can be put into a
  // string literal.
  var escapes = {
    "'":      "'",
    '\\':     '\\',
    '\r':     'r',
    '\n':     'n',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
  };

  var escaper = /\\|'|\r|\n|\u2028|\u2029/g;

  var escapeChar = function(match) {
    return '\\' + escapes[match];
  };

  // JavaScript micro-templating, similar to John Resig's implementation.
  // Underscore templating handles arbitrary delimiters, preserves whitespace,
  // and correctly escapes quotes within interpolated code.
  // NB: `oldSettings` only exists for backwards compatibility.
  _.template = function(text, settings, oldSettings) {
    if (!settings && oldSettings) settings = oldSettings;
    settings = _.defaults({}, settings, _.templateSettings);

    // Combine delimiters into one regular expression via alternation.
    var matcher = RegExp([
      (settings.escape || noMatch).source,
      (settings.interpolate || noMatch).source,
      (settings.evaluate || noMatch).source
    ].join('|') + '|$', 'g');

    // Compile the template source, escaping string literals appropriately.
    var index = 0;
    var source = "__p+='";
    text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
      source += text.slice(index, offset).replace(escaper, escapeChar);
      index = offset + match.length;

      if (escape) {
        source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
      } else if (interpolate) {
        source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
      } else if (evaluate) {
        source += "';\n" + evaluate + "\n__p+='";
      }

      // Adobe VMs need the match returned to produce the correct offest.
      return match;
    });
    source += "';\n";

    // If a variable is not specified, place data values in local scope.
    if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

    source = "var __t,__p='',__j=Array.prototype.join," +
      "print=function(){__p+=__j.call(arguments,'');};\n" +
      source + 'return __p;\n';

    try {
      var render = new Function(settings.variable || 'obj', '_', source);
    } catch (e) {
      e.source = source;
      throw e;
    }

    var template = function(data) {
      return render.call(this, data, _);
    };

    // Provide the compiled source as a convenience for precompilation.
    var argument = settings.variable || 'obj';
    template.source = 'function(' + argument + '){\n' + source + '}';

    return template;
  };

  // Add a "chain" function. Start chaining a wrapped Underscore object.
  _.chain = function(obj) {
    var instance = _(obj);
    instance._chain = true;
    return instance;
  };

  // OOP
  // ---------------
  // If Underscore is called as a function, it returns a wrapped object that
  // can be used OO-style. This wrapper holds altered versions of all the
  // underscore functions. Wrapped objects may be chained.

  // Helper function to continue chaining intermediate results.
  var result = function(instance, obj) {
    return instance._chain ? _(obj).chain() : obj;
  };

  // Add your own custom functions to the Underscore object.
  _.mixin = function(obj) {
    _.each(_.functions(obj), function(name) {
      var func = _[name] = obj[name];
      _.prototype[name] = function() {
        var args = [this._wrapped];
        push.apply(args, arguments);
        return result(this, func.apply(_, args));
      };
    });
  };

  // Add all of the Underscore functions to the wrapper object.
  _.mixin(_);

  // Add all mutator Array functions to the wrapper.
  _.each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      var obj = this._wrapped;
      method.apply(obj, arguments);
      if ((name === 'shift' || name === 'splice') && obj.length === 0) delete obj[0];
      return result(this, obj);
    };
  });

  // Add all accessor Array functions to the wrapper.
  _.each(['concat', 'join', 'slice'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      return result(this, method.apply(this._wrapped, arguments));
    };
  });

  // Extracts the result from a wrapped and chained object.
  _.prototype.value = function() {
    return this._wrapped;
  };

  // Provide unwrapping proxy for some methods used in engine operations
  // such as arithmetic and JSON stringification.
  _.prototype.valueOf = _.prototype.toJSON = _.prototype.value;

  _.prototype.toString = function() {
    return '' + this._wrapped;
  };

  // AMD registration happens at the end for compatibility with AMD loaders
  // that may not enforce next-turn semantics on modules. Even though general
  // practice for AMD registration is to be anonymous, underscore registers
  // as a named module because, like jQuery, it is a base library that is
  // popular enough to be bundled in a third party lib, but not be part of
  // an AMD load request. Those cases could generate an error when an
  // anonymous define() is called outside of a loader request.
  if (typeof define === 'function' && define.amd) {
    define('underscore', [], function() {
      return _;
    });
  }
}.call(this));

},{}],2:[function(require,module,exports){
window.Hammer = require("../vendor/hammer");
require("../vendor/tweenmax");


jQuery(document).ready(function () {
    window["$"] = jQuery;

    window.is_touch_device = function () {
        var prefixes = ' -webkit- -moz- -o- -ms- '.split(' ');
        var mq = function (query) {
            return window.matchMedia(query).matches;
        };

        if (('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch) {
            return true;
        }

        // include the 'heartz' as a way to have a non matching MQ to help terminate the join
        // https://git.io/vznFH
        var query = ['(', prefixes.join('touch-enabled),('), 'heartz', ')'].join('');
        return mq(query);
    };

    require("../ui/helpers");
    require("../ui/imageSize");
    require("../ui/mouse");
    require("../ui/filmstrip");
    require("../ui/loader");
    require("../ui/select");
    require("../ui/accordion");
    require("../ui/scrollableFilmstrip");
    require("../ui/dialog");
    require("../ui/tabs");
    require("../ui/slider");
    require("../ui/siteScroll");
    $(".ui-filmstrip").uiFilmstrip();
    $(".ui-select").uiSelect();
    $(".ui-accordion").uiAccordion();
    $(".ui-tabs").uiTabs();
    $(".ui-slider").uiSlider({v: 2});
    $(".ui-siteScroll").uiSiteScroll();
    if (is_touch_device()) {
        // if ($(window).width() < 600) {
        //     $(".ui-scrollableFilmstrip").uiScrollableFilmstrip({mode: 2, hover: false, boxScroll: false});
        // } else {
            $(".ui-scrollableFilmstrip").uiScrollableFilmstrip({mode: 2, hover: false});
        // }
    } else {
        $(".ui-scrollableFilmstrip").uiScrollableFilmstrip({mode: 2});
    }

    $(".ui-folding").each(function () {
        var $n = $(this);
        var top1 = 0;
        var $body = $("body");

        function menuSet() {
            var top = $(window).scrollTop();
            $n.removeClass("ui-folding-scrolled ui-folding-opened");
            if (top > 0) {
                $n.addClass("ui-folding-scrolled");
            }
            if (top < top1) {
                $n.addClass("ui-folding-opened");
            }
            top1 = top;
        }

        $(".ui-folding-icon").on("click", function () {
            if ($n.hasClass("ui-folding-opened")) {
                $n.removeClass("ui-folding-opened");
            } else {
                $n.addClass("ui-folding-opened");
            }
        });
        $n.addClass("destroy").on({
            destroy: function () {
                $(window).off({
                    scroll: menuSet,
                    resize: menuSet
                })
            }
        });

        setTimeout(menuSet, 10);
        $(window).on({
            scroll: menuSet,
            resize: menuSet
        })
    });
});                                                                                   
},{"../ui/accordion":3,"../ui/dialog":4,"../ui/filmstrip":5,"../ui/helpers":6,"../ui/imageSize":7,"../ui/loader":8,"../ui/mouse":10,"../ui/scrollableFilmstrip":11,"../ui/select":12,"../ui/siteScroll":13,"../ui/slider":14,"../ui/tabs":15,"../vendor/hammer":17,"../vendor/tweenmax":18}],3:[function(require,module,exports){
var parseData = require("../utils/parseData");
function Accordion(elm, options) {
    var $elm = $(elm);
    options = $.extend({
        closeOthers: parseData.getBoolean(elm, "closeothers", false), slideTime: 0.5, slide: true}, options);

    function show() {
        $(".ui-accordion-body", $elm).each(function () {
            var h = getHeight($(this));
            if (h > 0) {
                $(this).data("height", h);
            }
            $(this).prev().toggleClass("closed", $(this).is(":hidden"));
        }).on({
            load: function () {
                $(this).data("height", getHeight($(this).closest(".ui-accordion-body")));
            }
        }, "img");
        $elm.removeClass("show").off({show: show});
        $(".ui-accordion-header", $elm).each(function () {
            if ($(this).hasClass("closed")) {
                $(this).next().css({display: "none", height: "0px"});
            } else {
                $(this).next().show();
            }
        });
    }

    if ($elm.closest(":hidden").length && !$elm.hasClass("show")) {
        $elm.addClass("show").on({
            show: function () {
                if ($elm.closest(":hidden").length == 0) {
                    show();
                }
            }
        });
    } else {
        show();
    }


    function getHeight($body) {
        var $c1 = $body.clone().css({
            visibility: "hidden", position: "relative",
            display: "block", left: "-99999px", height: ""
        }).insertAfter($body);
        var h = $c1.height();
        $c1.remove();
        return h;
    }

    function update($body, h) {
        if (h == 0) {
            $body.hide().trigger("ui.accordion.hideEnd");
        } else {
            $body.css({height: ""}).trigger("ui.accordion.showEnd");
            $body.find(".show").trigger("show");
        }
    }


    function updateHeight($body) {
        var h = getHeight($body);
        if (h > 0) {
            $body.data("height", h);
        }
    }

    function to($body, h) {
        $body.css({display: "block"});
        var hasHeight = !!$body.data("height");
        if (options.slide && hasHeight) {
            TweenLite.to($body, options.slideTime, {
                css: {height: h + "px"}, ease: Power2.easeOut, onComplete: function () {
                    update($body, h);
                }
            });
        } else {
            update($body, h);
        }

    }


    $elm.on({
        click: function (e) {
            if ($(e.target).closest("a,button").size() > 0) {
                return;
            }
            if ($(this).closest(".ui-accordion").get(0) != $elm.get(0)) {
                return;
            }
            var $body = $(this).next(),
                closed = $(this).hasClass("closed"),
                h;
            if (closed) {
                h = $body.data("height");
                if (h == 0) {
                    updateHeight($body);
                    h = $body.data("height");
                }
                $(this).removeClass("closed");
                $(this).next().trigger("ui.accordion.showStart");
            } else {
                updateHeight($body);
                $(this).addClass("closed");
                $(this).next().trigger("ui.accordion.hideStart");
                h = 0;
            }
            to($body, h);
            if (options.closeOthers && h > 0) {
                $elm.find(".ui-accordion-header:not(.closed)").not(this).each(function () {
                    to($(this).addClass("closed").next(), 0);
                });
            }
        }
    }, ".ui-accordion-header");

    $elm.data("ui", {});

}

$.fn.uiAccordion = function (options) {
    return $(this).each(function () {
        if ($(this).data("ui")) {
            return;
        }
        new Accordion(this, options);
    });
};
},{"../utils/parseData":16}],4:[function(require,module,exports){
$.fn.uiDialog = function (options) {
    options = $.extend({
        overlayClose: true,
        resize: false,
        modal: true,
        minGap: 15
    }, options);
    return this.each(function () {
        var elm = this;
        var $window = $(window);
        var $document = $(document);
        var dialog = $("<div class='ui-dialog'>");
        if (options.modal) {
            var overlay = $('<div class="ui-dialog-overlay">').appendTo("body");
        }

        if ($(elm).data("width")) {
            options.width = parseInt($(elm).data("width"), 10);
        }
        if ($(elm).data("height")) {
            options.height = parseInt($(elm).data("height"), 10);
        }
        if ($(elm).data("grow")) {
            options.grow = true;
        }
        if (options.modal) {
            overlay.bindTap().on({
                click: function (e) {
                    e.preventDefault();
                    if (options.overlayClose) {
                        $(elm).trigger("dialog.close");
                    } else {
                        dialog.addClass("ui-dialog-deactivate");
                        setTimeout(function () {
                            dialog.removeClass("ui-dialog-deactivate");
                        }, 100);
                    }
                }
            });
        } else {
            dialog.addClass("ui-dialog-float");
        }


//        $("body").css({overflow:"hidden"});
        var width = options.width || Math.floor($window.width() * 0.8);
        var height = options.height || Math.floor($window.height() * 0.8);

        if ($window.width() < width + options.minGap * 2) {
            width = $window.width() - options.minGap * 2;
        }
        if ($window.height() < height + options.minGap * 2) {
            height = $window.height() - options.minGap * 2;
        }

        var left = ($window.width() - width) / 2;

        var top;

        if ($window.height() > height) {
            top = ($window.height() - height) / 2 + $window.scrollTop();
        } else {
            top = options.minGap;
        }

        if (top < 0) {
            top = 0;
        }

        $("body .ui-dialog").last().each(function () {
            var p = $(this).offset();
            if (p.top == top) {
                top += 20;
            }
            if (p.left == left) {
                left += 20;
            }
        });

        dialog.appendTo("body").css({
            width: width + "px",
            height: height + "px",
            left: left + "px",
            top: top + "px",
            visibility: "hidden"
        });

        if (options.grow) {
            dialog.css({height: "auto", minHeight: height + "px"});
        }

        function windowResize() {
            if (options.modal) {
                overlay.css({width: $window.width() + "px", height: $document.height() + "px"});
            }
//            dialog.css({left: (($window.width() - width) / 2) + "px"});
        }

        function documentKeydown(e) {
            if (options.overlayClose && e.which == 27) {
                $(".ui-dialog:last").children().trigger("dialog.close");
                e.stopImmediatePropagation();
            }
        }


        dialog.append(elm);
        setTimeout(function () {
            var dHeight = dialog.height();
            if ($window.height() > dHeight) {
                top = ($window.height() - dHeight) / 2 + $window.scrollTop();
                dialog.css({
                    top: top + "px",
                    visibility: ""
                });
            } else {
                dialog.css({
                    visibility: ""
                });
            }
        }, 20);

        if (options.resize) {
            dialog.uiResize({invert: false});
        }

        dialog.find(".ui-dialog-header").onMouse({
            "mouse.start": function (e, pos) {
                pos.data.x = dialog.position().left;
                pos.data.y = dialog.position().top;
                pos.preventDefault();
                if (dialog.find(".ui-dialog-header").get(0) == e.target) {
                    pos.data.move = true;
                }
            },
            "mouse.move": function (e, pos) {
                var diff = pos.diff();
                if (pos.data.move) {
                    var t1 = pos.data.y + diff.y;
                    if (t1 < 0) {
                        t1 = 0;
                    }
                    dialog.css({left: pos.data.x + diff.x + "px", top: t1 + "px"});
                }
            }
        });
        $(window).on("resize", windowResize);
        $(window).on("keydown", documentKeydown);

        windowResize();
        $(elm).bind("dialog.close", function () {
            $(window).off("resize", windowResize);
            $(window).off("keydown", documentKeydown);
            dialog.hide();
            $(elm).trigger("dialog.closed");
            dialog.destroy();
            if (options.modal) {
                overlay.destroy();
            }
        }).addClass("ui-dialog-content");

        $(".ui-dialog-close, .ui-dialog-cancel", dialog).bindTap().click(function () {
            $(elm).trigger("dialog.close");
            return false;
        });
    });
};

},{}],5:[function(require,module,exports){
var _ = require("underscore");
$.fn.uiFilmstrip = function (options) {
    options = $.extend({scrollTimeout: 700, autoPlay: $(this).data("autoplay")}, options);
    return $(this).each(function () {
        var elm = this, $elm = $(elm);
        var $content = $(".ui-filmstrip-scroll", elm);
        var childWidth = $content.children().eq(0).width();
        var minWidth = 0;
        if ($elm.data("minwidth")) {
            minWidth = $elm.data("minwidth");
        }

        var w = 0, h = 0, tw = 0, cContent = null;

        cContent = $content.clone(true).addClass("cloned");
        cContent.hide().children();
        $content.after(cContent);
        function updateWidth() {
            if (!$elm.find(".ui-filmstrip-content").get(0).ownerDocument.defaultView) {
                return;
            }
            if (!childWidth) {
                childWidth = $content.children().eq(0).width();
            }
            var cw = $elm.find(".ui-filmstrip-content").width(),
                cs = $content.children().size();
            var a1 = 0;
            if (childWidth < cw) {
                a1 = Math.floor(cw / Math.round(cw / childWidth))
            }
            if (a1 * cs < cw && cs > 0 && a1 > 0) {
                a1 = Math.round(cw / cs);
            }
            if (minWidth > 0 && a1 < minWidth && minWidth < cw && a1 > 0) {
                a1 = Math.round(cw / Math.floor(cw / minWidth));
            }
            if (a1 <= 0) {
                a1 = cw;
            }
            $content.children().css({width: a1 + "px"});
            cContent.children().css({width: a1 + "px"});
            w = 0;
            tw = 0;
            h = 0;
            $content.children().css({height: ""}).each(function () {
                var t1 = $(this).outerWidth(true);
                if (t1 > tw) {
                    tw = t1;
                }
                var h1 = $(this).outerHeight(true);
                if (h1 > h) {
                    h = h1;
                }
                w += t1;
            });

            $content.css({width: w + "px"});
            cContent.css({width: w + "px"});
            $elm.find(".ui-filmstrip-content").css({height: h + "px"});

            var l1 = $content.position().left;
            var l2 = cContent.position().left;
            if (l1 > l2) {
                cContent.css({left: l1 - w + "px"});
            } else {
                cContent.css({left: l1 + w + "px"});
            }
            cContent.show();
            updateX(0);
        }

        $content.find("img").load(function () {
            updateWidth();
        }).imageSize();


        var x = 0, t1 = 0;

        function updateX(speed) {
            if (_.isUndefined(speed)) {
                speed = options.scrollTimeout / 1000;
            }
            TweenLite.killTweensOf($content);
            TweenLite.killTweensOf(cContent);
            var w0 = $content.children().size();
            var w1 = Math.round($elm.find(".ui-filmstrip-content").width() / tw);
            if (x < -w0) {
                x = -w0;
            } else if (x > w1) {
                x = w1;
            }
            var l = tw * x, l2, l1 = $content.position().left;
            if (l >= 0 && l1 >= 0) {
                l2 = tw * (x - w0);
                cContent.css({left: l1 - w + "px"});
            } else {
                l2 = tw * (x + w0);
                cContent.css({left: l1 + w + "px"});
            }


            TweenLite.to($content[0], speed, {
                css: {left: l + "px"},
                ease: Power2.easeIn, onComplete: function () {
                    if (x + w0 == 0) {
                        x = 0;
                        $content.css({left: l2 + "px"});
                    } else if (x - w1 == 0) {
                        x = w1 - w0;
                        $content.css({left: l2 + "px"});
                    }

                }
            });
            TweenLite.to(cContent[0], speed, {
                css: {left: l2 + "px"},
                ease: Power2.easeIn, onComplete: function () {
                    l = $content.position().left;
                    if (l > 0) {
                        cContent.css({left: l - w + "px"});
                    } else {
                        cContent.css({left: l + w + "px"});
                    }
                }
            });

        }

        if (false) {
            $elm.find(".ui-filmstrip-content").on("mousewheel DOMMouseScroll", function (e) {
                var delta = e.originalEvent.detail < 0 || e.originalEvent.wheelDelta > 0 ? 1 : -1;
                if (t1 < $.now() - options.scrollTimeout) {
                    x += delta;
                    updateX();
                    t1 = $.now();
                }
                e.preventDefault();
            });
        }

        Hammer($elm.find(".ui-filmstrip-left").get(0)).on("tap", function (e) {
            x++;
            updateX();
        });
        Hammer($elm.find(".ui-filmstrip-right").get(0)).on("tap", function (e) {
            x--;
            updateX();
        });
        function dragMove(l1) {
            $content.css({left: tw * x + l1 + "px"});
            if (l1 > 0) {
                cContent.css({left: tw * x + l1 - w + "px"});
            } else {
                cContent.css({left: tw * x + l1 + w + "px"});
            }
        }

        function bindDrags(elm) {
            Hammer(elm).on("dragstart", function (e) {
                if (options.autoPlay) {
                    clearInterval(apInterval);
                }
            }).on("dragright", function (e) {
                e.gesture.preventDefault();
                dragMove(e.gesture.deltaX);
            }).on("dragleft", function (e) {
                e.gesture.preventDefault();
                dragMove(e.gesture.deltaX);
            }).on("dragend", function (e) {
                var l = $content.position().left;
                x = Math.round(l / tw);
                updateX();
            });
        }

        if (options.isTpl !== true){
            bindDrags($content.get(0));
            bindDrags(cContent.get(0));
        }


        var apInterval;
        if (options.autoPlay && options.isTpl !== true) {
            function autoMove() {
                x--;
                updateX();
            }
            apInterval = setInterval(autoMove, options.autoPlay);

//            $elm.on({
//                mouseenter: function () {
//
//                },
//                mouseleave: function () {
//                    apInterval = setInterval(autoMove, options.autoPlay);
//                }
//            });
        }

        $(window).resize(updateWidth);
        if ($elm.is(":hidden")) {
            $elm.addClass("show");
        } else {
            updateWidth();
        }
        $elm.on({
            updateUi: function () {
                updateWidth();
            },
            show: function () {
                // $elm.removeClass("show");
                updateWidth();
            },
            destroy: function () {
                if (apInterval){
                    clearInterval(apInterval);
                }

                $(window).off({resize: updateWidth});

            }
        }).addClass("destroy");
    });
};


},{"underscore":1}],6:[function(require,module,exports){
$.fn.destroy = function () {
    return this.each(function () {
        var elm = $(this).detach();
        if (elm.hasClass("destroy")) {
            elm.trigger("destroy");
        }
        elm.find(".destroy").trigger('destroy');
        elm.remove();
    });
};
$.fn.showInit = function () {
    return this.each(function () {
        var elm = $(this).show();
        elm.find(".show").trigger('show');
    });
};


$.fn.uiVal = function () {
    var ui;
    if (arguments.length == 0) {
        ui = $(this).data("ui");
        return ui && ui.getValue()
    }
    var v = arguments[0];
    return $(this).each(function () {
        ui = $(this).data("ui");
        if (ui) {
            ui.setValue(v);
        }
    });
};
},{}],7:[function(require,module,exports){
$.fn.imageSize = function (options) {

    return $(this).each(function () {
        options = $.extend({
            width: 1, height: 1, animateOpacity: false
        }, options);
        function onLoad() {
            var a1 = this.naturalWidth / this.naturalHeight;
            var a2 = 1;
            if (options.height > 0) {
                a2 = options.width / options.height;
            }
            if (a1 > a2) {
                $(this).addClass("fit-switch");
            }
            if (options.animateOpacity) {
                $(this).animate({opacity: 1}, 200);
            }
        }
        if ($(this).hasClass("show")){
            if ($(this).is(":visible")){
                $(this).on("load", onLoad).attr("src", $(this).data("src")).removeClass("show");
            } else {
                function show(){
                    $(this).on("load", onLoad).attr("src", $(this).data("src")).removeClass("show");
                    $(this).off("show", show);
                }
                $(this).on("show", show);
            }
        } else {
            if (this.naturalWidth > 0) {
                $(this).removeClass("fit-switch");
                onLoad.call(this);
            } else {
                $(this).on("load", onLoad);
            }
        }


    });
};


},{}],8:[function(require,module,exports){
$.fn.uiLoader = function (options) {
    options = $.extend({}, options);
    return this.each(function () {
        var $elm = $(this), $clock = $('<div class="ui-loader-clock">').appendTo($elm);
        var $image = $('<div class="ui-loader-image">').appendTo($clock);
        $elm.addClass("ui-loader");
        $clock.css({display: "none"});
        var scrollFn = function () {
            var elmTop = $elm.offset().top;
            var elmHeight = $elm.height();
            var windowHeight = $(window).height();
            var windowScrollTop = $(window).scrollTop();

            var top = Math.max(elmTop, windowScrollTop);
            var bottom = Math.min(elmTop + elmHeight, windowScrollTop + windowHeight);
            var a = (bottom - top) / 2;
            //console.log({
            //    elmTop: elmTop,
            //    elmHeight: elmHeight,
            //    windowHeight: windowHeight,
            //    windowScrollTop: windowScrollTop,
            //    top: top,
            //    bottom: bottom,
            //    a: a,
            //    b: a + elmTop - windowScrollTop
            //});
            $image.css({top: (a + Math.max(windowScrollTop - elmTop, 0)) + "px"});
        };

        function stop() {
            $elm.removeClass("ui-loading");
            $clock.css({display: "none"});
            $(window).off("scroll", scrollFn);
        }


        $elm.on({
            "loader.stop": function (e) {
                stop();
            },
            "loader.stopOne": function (e) {
                stop();
                e.stopPropagation();
            },
            "loader.start": function (e) {
                e.stopPropagation();
                $(window).on("scroll", scrollFn);
                var elmTop = $elm.offset().top;
                var elmHeight = $elm.height();
                var windowHeight = $(window).height();
                var windowScrollTop = $(window).scrollTop();

                var top = Math.max(elmTop, windowScrollTop);
                var bottom = Math.min(elmTop + elmHeight, windowScrollTop + windowHeight);
                var a = (bottom - top) / 2;
                $image.css({top: (a + Math.max(windowScrollTop - elmTop, 0)) + "px"});

                $elm.removeClass("ui-loading");
                $elm.addClass("ui-loading");
                $clock.css({opacity: 0.7, display: "block"});
            }
        })
    });
};


},{}],9:[function(require,module,exports){
//var styles = require("./styles");

function getScrollBarWidth() {
//    var defaultStyle = getDefaultStyle(); //Default browser element styles (styles.js)

    var inner = document.createElement('p');
    inner.style.width = "100%";
    inner.style.height = "200px";

    var outer = document.createElement('div');
    outer.style.position = "absolute";
    outer.style.top = "0px";
    outer.style.left = "0px";
    outer.style.visibility = "hidden";
    outer.style.width = "200px";
    outer.style.height = "150px";
    outer.style.overflow = "hidden";
    outer.appendChild(inner);

    document.body.appendChild(outer);
    var w1 = inner.offsetWidth;
    outer.style.overflow = 'scroll';
    var w2 = inner.offsetWidth;
    if (w1 == w2) {
        w2 = outer.clientWidth;
    }
    document.body.removeChild(outer);
    return (w1 - w2);
}

var SCROLL_BAR_WIDTH;
$(function () {
    SCROLL_BAR_WIDTH = getScrollBarWidth();
});

exports.getScrollBarWidth = getScrollBarWidth;

},{}],10:[function(require,module,exports){
function OnMouse(elm, events, selector) {
    var $elm = $(elm),
        positionStart,
        position = {},
        target,
        preventDefault = false,
        stopPropagation = false,
        dragDetect = null,
        drag = 0,
        moved = false,
        canceled = false;
    var posObj = {
        data: {},
        position: function () {
            return {
                x: position.x,
                y: position.y
            }
        },
        detectHorizontalDrag: function (x, y) {
            dragDetect = {x: x, y: y, type: "horizontal"};
        },
        detectDrag: function (x, y) {
            dragDetect = {x: x, y: y, type: "both"};
        },
        positionStart: function (obj) {
            if (obj && obj.x) {
                positionStart.x = obj.x;
            }
            if (obj && obj.y) {
                positionStart.y = obj.y;
            }
            return {
                x: positionStart.x,
                y: positionStart.y
            }
        },
        diff: function () {
            return {
                x: position.x - positionStart.x,
                y: position.y - positionStart.y
            }
        },
        isTouch: function () {
            return position.touch;
        },
        isCanceled: function () {
            return canceled;
        },
        isDrag: function () {
            return drag == 1;
        },
        hasMoved: function () {
            return moved;
        },
        preventDefault: function () {
            preventDefault = true;
        },
        isDefaultPrevented: function () {
            return preventDefault;
        },
        stopPropagation: function () {
            stopPropagation = true;
        }
    };

    function getMouse(event) {
        return {
            x: event.pageX + (event.iframeLeft || 0),
            y: event.pageY + (event.iframeTop || 0),
            touch: false
        }
    }

    function getTouch(event) {
        var touches = event.originalEvent.touches;
        if (touches && touches.length > 0) {
            return {
                x: touches[0].pageX,
                y: touches[0].pageY,
                touch: true
            }
        }

        return null;
    }

    function detectDrag() {
        var diff = posObj.diff();
        if (dragDetect && dragDetect.type == "horizontal") {
            if (Math.abs(diff.x) > dragDetect.x && drag == 0) {
                drag = 1;
                target.trigger("drag.start", [posObj]);
                posObj.preventDefault();
            } else if (Math.abs(diff.y) > dragDetect.y && drag == 0) {
                drag = 2;
            }
        } else if (dragDetect && dragDetect.type == "both") {
            if ((Math.abs(diff.y) > dragDetect.y || Math.abs(diff.x) > dragDetect.x) && drag == 0) {
                drag = 1;
                target.trigger("drag.start", [posObj]);
                posObj.preventDefault();
            }
        }
        if (drag == 1) {
            target.trigger("drag.move", [posObj]);
        }
    }

    function detectMove() {
        if (Math.abs(position.x) > 0 || Math.abs(position.y) > 0) {
            moved = true;
        }
    }

    function mousemove(event) {

        position = getMouse(event);
        target.trigger("mouse.move", [posObj]);
        detectDrag();
        detectMove();

        if (preventDefault) {
            event.preventDefault();
        }
        if (stopPropagation) {
            event.stopPropagation();
        }
    }

    function touchmove(event) {

        position = getTouch(event);
        target.trigger("mouse.move", [posObj]);
        detectDrag();
        detectMove();
        if (preventDefault) {
            event.preventDefault();
        }
        if (stopPropagation) {
            event.stopPropagation();
        }

    }

    function scroll() {
        drag = 2;
    }

    function globalBind(name, type) {
        if ("type" == "touch") {
//            $(window).bind("touchmove", touchmove);

        } else {
            $(window)[name]({
                mouseup: mouseup,
                mousemove: mousemove
//                scroll: scroll
            });
            $(window)[name]({
                keydown: keydown
            });
        }

    }

    function mouseup(event) {
        position = getMouse(event);
        target.trigger("mouse.stop", [posObj]);
        if (posObj.isDrag()) {
            target.trigger("drag.stop", [posObj]);
        }
        drag = 0;
        if (preventDefault) {
            event.preventDefault();
        }
        if (stopPropagation) {
            event.stopPropagation();
        }
        globalBind("off");
    }

    function touchend(event) {
        target.trigger("mouse.stop", [posObj]);
        if (posObj.isDrag()) {
            target.trigger("drag.stop", [posObj]);
        }
        drag = 0;
        if (preventDefault) {
            event.preventDefault();
        }
        if (stopPropagation) {
            event.stopPropagation();
        }
        globalBind("off", "touch");
    }

    function touchcancel(event) {
        target.trigger("mouse.end", [posObj]);
        canceled = true;
        if (preventDefault) {
            event.preventDefault();
        }
        if (stopPropagation) {
            event.stopPropagation();
        }
    }

    function keydown(e) {
        if (e.which == 27) {
            canceled = true;
            console.log("cancel");
            position = {x: -1, y: -1};
            target.trigger("mouse.stop", [posObj]);
            if (preventDefault) {
                e.preventDefault();
            }
            if (stopPropagation) {
                e.stopPropagation();
            }
            globalBind("off");
        }
    }

    function reset() {
        canceled = false;
        moved = false;
        posObj.data = {};
        drag = 0;
        dragDetect = null;
    }

    function mousedown(event) {
        if (event.which == 1 && !posObj.isTouch()) {

            posObj.iframeLeft = event.iframeLeft = Number($(this.ownerDocument).find("body").attr("data-iframeleft") || 0);
            posObj.iframeTop = event.iframeTop = Number($(this.ownerDocument).find("body").attr("data-iframetop") || 0);
            position = positionStart = getMouse(event);
            preventDefault = event.isDefaultPrevented();
            target = $(this);
            reset();
            target.trigger("mouse.start", [posObj]);
            if (dragDetect && !posObj.isTouch()) {
                target.trigger("drag.start", [posObj]);
                posObj.preventDefault();
            }
            if (preventDefault) {
                event.preventDefault();
            }
            if (stopPropagation) {
                event.stopPropagation();
            }
            globalBind("on");
        }
    }

    function touchstart(event) {
        if (event.originalEvent.touches.length > 1) {
            return;
        }
        position = positionStart = getTouch(event);
        globalBind("on", "touch");
        preventDefault = event.isDefaultPrevented();
        target = $(this);
        reset();
        target.trigger("mouse.start", [posObj]);
        if (preventDefault) {
            event.preventDefault();
        }
        if (stopPropagation) {
            event.stopPropagation();
        }

    }

    function gesturechange(event) {
        event.preventDefault();
        $elm.trigger("mouse.scale", [posObj, event.originalEvent.scale]);
    }

    $elm.on({
        touchstart: touchstart,
        touchmove: touchmove,
        gesturechange: gesturechange,
        touchend: touchend,
//        touchcancel: touchcancel,
        mousedown: mousedown
    }, selector);

    $elm.on(events, selector);
}

$.fn.onMouse = function (events, selector) {
    return this.each(function () {
        new OnMouse(this, events, selector);
    });
};

$.isTouchDevice = function () {
    return 'ontouchstart' in window // works on most browsers
        || 'onmsgesturechange' in window; // works on ie10
};

var touchId = null;

$.fn.bindTap = function (events, selector) {
    return this.each(function () {
        var $elm = $(this);
        var touchClick = false;
        $elm.on({
            touchstart: function (e) {
                if (e.originalEvent.touches.length > 1) {
                    return;
                }

//                touchClick = true;
                touchClick = touchId = new Date().getTime();
//                alert("start");
//                e.preventDefault();
            },
            touchmove: function (e) {
//                if (e.originalEvent.touches.length > 1) {
//                    return;
//                }
//                touchClick = false;
            },
            touchend: function (e) {
                if (e.originalEvent.touches.length > 1) {
                    return;
                }
                e.preventDefault();
                if (touchClick === touchId) {
                    $(e.target).trigger("click");
                    touchClick = false;
                }
            },
            touchcancel: function () {
//                touchClick = false;
            }
        }, selector);
        $elm.on({
            gesturechange: function (e) {
                e.preventDefault();
                var scale = e.originalEvent.scale;
                alert("scale " + scale);
            },
            gestureend: function (e) {

            }
        });
        $elm.on(events, selector);
    });
};


//(function () {
//    var noTouchElements = "|SELECT|A|";
//    if ($(".lt-ie9").length > 0) {
//        $(document).on({
//            click: function (e) {
//                $(e.target).trigger("tap");
//            }
//        });
//    } else {
//        var touchClick = false;
//        var mouseEnabled = true;
//        var mouseClick = false;
//        document.addEventListener("touchstart", function () {
//            touchClick = true;
//            mouseEnabled = false;
//        }, false);
//        document.addEventListener("touchmove", function () {
//            touchClick = false
//        }, false);
//        document.addEventListener("touchend", function (e) {
//
//            if (touchClick && noTouchElements.indexOf(e.target.tagName) == -1) {
//                e.preventDefault();
//                touchClick = false;
//                var event = document.createEvent("CustomEvent");
//                event.initCustomEvent("tap", true, true, e.target);
//                e.target.dispatchEvent(event);
//            }
//        }, false);
//
//
//        document.addEventListener("mousedown", function () {
//            if (mouseEnabled) {
//                mouseClick = true
//            }
//        }, false);
//        document.addEventListener("mousemove", function () {
//            mouseClick = false
//        }, false);
//        document.addEventListener("mouseup", function (e) {
//            if (mouseClick && noTouchElements.indexOf(e.target.tagName) == -1) {
//                e.preventDefault();
//                mouseClick = false;
//                var event = document.createEvent("CustomEvent");
//                event.initCustomEvent("tap", true, true, e.target);
//                e.target.dispatchEvent(event);
//            }
//        }, false);
//    }
//}());

},{}],11:[function(require,module,exports){
//mode 1 = "horizontal", mode 2 = "vertical"
function ScrollableFilmstrip(elm, options) {
    var $elm = $(elm), prop = $elm.hasClass("vertical") ? {"v": "top", "t": "height", c: "y"} : {
            "v": "left",
            "t": "width",
            c: "x"
        };
    options = $.extend({
        mode: 1,
        clickMove: 100,
        interval: 10,
        move: 5,
        hover: true,
        boxScroll: true,
        endless: !!$(elm).data("endless")
    }, options);
    var i, func, max, timer, boxes = $elm.find(".ui-filmstrip-box").show(),
        left = $elm.find(".ui-filmstrip-prev"), right = $elm.find(".ui-filmstrip-next"), boxesImg = boxes.find("img");

    function positionBoxes(number, anim) {
        anim = anim || false;
        if (boxes.length == 0) {
            return;
        }
        var cWidth = boxes.eq(0).position()[prop.v] + number;
        for (i = 0, max = boxes.length; i < max; i++) {
            var css = {};
            css[prop.v] = cWidth;
            if (anim) {
                TweenLite.killTweensOf(boxes.eq(i));
                TweenLite.to(boxes.eq(i), 0.5, {
                    css: css, ease: Power2.easeIn, onComplete: function () {
                    }
                });
            } else {
                boxes.eq(i).css(css);
            }
            cWidth += boxes.eq(i)[prop.t]();
        }
        if (anim) {
            setTimeout(function () {
                $elm.removeClass("status-start");
                $elm.removeClass("status-end");
                if (boxes.eq(0).position()[prop.v] == 0) {
                    $elm.addClass("status-start");
                }
                if (boxes.eq(boxes.length - 1).position()[prop.v] + boxes.eq(boxes.length - 1)[prop.t]() == $(elm)[prop.t]()) {
                    $elm.addClass("status-end");
                }
                $elm.trigger("filmstrip.moved");
            }, 600);
        } else {
            $elm.removeClass("status-start");
            $elm.removeClass("status-end");
            if (boxes.eq(0).position()[prop.v] == 0) {
                $elm.addClass("status-start");
            }
            if (boxes.eq(boxes.length - 1).position()[prop.v] + boxes.eq(boxes.length - 1)[prop.t]() == $(elm)[prop.t]()) {
                $elm.addClass("status-end");
            }
            $elm.trigger("filmstrip.moved");
        }
    }

    function hideArrows() {
        var a = 0;
        for (i = 0; i < boxesImg.length; i++) {
            a += boxesImg.eq(i)[prop.t]();
        }
        var b = $elm[prop.t]();
        if (a < b) {
            left.css({display: "none"});
            right.css({display: "none"});
        } else {
            left.css({display: ""});
            right.css({display: ""});
        }
    }

    boxesImg.imageSize();
    if (boxesImg.length > 0) {
        var toLoad = boxesImg.length;
        var imgLoaded = 0;
        for (i = 0; i < boxesImg.length; i++) {
            if (boxesImg.eq(i)[prop.t]() > 0) {
                toLoad--;
            } else {
                boxesImg.eq(i).load(function () {
                    imgLoaded++;
                    $elm.trigger("imageLoad", [imgLoaded]);
                });
            }
        }
        $elm.on({
            "imageLoad": function (e, num) {
                if (num == toLoad) {
                    positionBoxes(0);
                }
                hideArrows();
            }
        }).trigger("imageLoad", [imgLoaded]);
    } else {
        positionBoxes(0);
    }
    hideArrows();


    function resize() {
        if (boxesImg.length > 0) {
            positionBoxes(0);
        }
        hideArrows();
    }

    $elm.on({
        updateUi: resize,
        show: resize,
        positionBoxes: function (e, a) {
            if (a) {
                positionBoxes(a.number, a.anim);
            }
        },
        destroy: function () {
            $(window).off({
                mousewheel: scrolled,
                resize: resize,
                DOMMouseScroll: scrolled
            });
        }
    }).addClass("show destroy");


    $(window).on({
        //mousewheel: scrolled,
        resize: resize
        //DOMMouseScroll: scrolled
    });
    function scrolled(e) {
        if ($elm.get(0) == e.target) {
            e.preventDefault();
            if (e.originalEvent.detail > 0 || e.originalEvent.wheelDelta < 0) {
                right.trigger("click");
            } else {
                left.trigger("click");
            }
            return false;
        }
        return true;
    }


    $elm.on({
        mouseenter: function () {
            $(this).addClass("scrollableFilmstrip");
        },
        mouseleave: function () {
            $(this).removeClass("scrollableFilmstrip");
        }
    });
    if (options.boxScroll) {
        boxes.onMouse({
            "mouse.start": function (e, pos) {
                pos.preventDefault();
                pos.data.x = $(this).position().left;
                pos.data.y = $(this).position().top;
                pos.data.diff2 = 0;
            },
            "mouse.move": function (e, pos) {
                var diff = pos.diff();
                var move = diff[prop.c] - pos.data.diff2;
                var first = boxes.eq(0);
                var last = boxes.eq(boxes.length - 1);
                if (first.position()[prop.v] + move > 0) {
                    move = 0;
                } else if (last.position()[prop.v] + last[prop.t]() + move < $elm[prop.t]()) {
                    move = 0;
                }
                positionBoxes(move);
                pos.data.diff2 = diff[prop.c];
            }
        });
    }

    right.on({
        mouseenter: function () {
            if (options.hover) {
                func = function () {
                    if (boxes.eq(boxes.length - 1).position()[prop.v] + boxes.eq(boxes.length - 1)[prop.t]()
                        > $(elm)[prop.t]()) {
                        positionBoxes(-(options.move));
                    } else if (options.endless) {
                        var newBox = boxes.eq(0).clone().addClass("clone");
                        $(elm).append(newBox);
                        boxes.eq(0).remove();
                        boxes = $(elm).find(".ui-filmstrip-box");
                        positionBoxes(-(options.move));
                    }
                };
                timer = setInterval(func, options.interval);
            }
        },
        click: function () {
            options.clickMove = $elm[prop.t]() / 2;
            var s = (boxes.eq(boxes.length - 1).position()[prop.v] + boxes.eq(boxes.length - 1)[prop.t]() - $(elm)[prop.t]());
            if (s >= options.clickMove) {
                positionBoxes(-(options.clickMove), true);
            } else if (s == 0) {

            } else if (s > 0) {
                positionBoxes(-(s), true);
            }
        },
        mouseleave: function () {
            if (options.hover) {
                if (timer) {
                    clearInterval(timer);
                }
            }
        }
    });
    left.on({
        mouseenter: function () {
            if (options.hover) {
                func = function () {
                    if (boxes.eq(0).position()[prop.v] < 0) {
                        positionBoxes(options.move);
                    } else if (options.endless) {
                        var newBox = boxes.eq(boxes.length - 1).clone().addClass("clone");
                        var css = {};
                        css[prop.v] = boxes.eq(0).position()[prop.v] - boxes.eq(boxes.length - 1)[prop.t]();
                        newBox.css(css);
                        $(elm).prepend(newBox);
                        boxes.eq(boxes.length - 1).remove();
                        boxes = $(elm).find(".ui-filmstrip-box");
                        positionBoxes(options.move);
                    }
                };
                timer = setInterval(func, options.interval);
            }
        },
        mouseleave: function () {
            if (options.hover) {
                if (timer) {
                    clearInterval(timer);
                }
            }
        },
        click: function () {
            options.clickMove = $elm[prop.t]() / 2;
            var s = boxes.eq(0).position()[prop.v];
            if (s == 0) {

            } else if (-(s) >= options.clickMove) {
                positionBoxes(options.clickMove, true);
            } else {
                positionBoxes(-(s), true);
            }
        }
    });
    setTimeout(function () {
        resize();
    }, 50);
}

$.fn.uiScrollableFilmstrip = function (options) {

    return this.each(function () {
        new ScrollableFilmstrip(this, options);
    });
};



},{}],12:[function(require,module,exports){
var parseData = require("../utils/parseData");
$.fn.uiSelect = function (options1) {
    return this.each(function () {

        var options = $.extend({
            menu: parseData.getBoolean(this, "menu", false),
            overlay: parseData.getBoolean(this, "overlay", false)
        }, options1);

        var elm = this, $elm = $(elm);
        var select = $("select", $elm),
            selectValue = $(".ui-select-value", $elm), ul;
        if (selectValue.size() == 0) {
            selectValue = $('<span class="ui-select-value"></span>');
            $elm.append(selectValue);
        }
        if (select.size() == 0) {
            select = $('<select>');
            select.append('<option></option>');
            select.appendTo($elm);
        }

        select.css({opacity: 0});
        function isInside(x, y) {
            var width = $elm.outerWidth(),
                height = $elm.outerHeight(),
                top = $elm.offset().top,
                left = $elm.offset().left;
            return x >= left && x <= left + width && y >= top && y <= top + height;
        }

        select.css({left: 0, top: 0});
        $elm.on({
            mousemove: function (e) {
                if (isInside(e.pageX, e.pageY)) {
                    var o = $elm.offset(),
                        x = (e.pageX - o.left) - 15,
                        y = (e.pageY - o.top) - 15;
//                    select.css({left:x + "px", top:y + "px"});
                }
            }
        });


        function showOverlay() {
            ul = $("<ul></ul>");
            var optionsElm = select.find("option");
            optionsElm.each(function (i) {
                var opt = $(this);
                var text = opt.text();
                if (opt.data("html")) {
                    text = opt.data("html");
                }
                var li = $("<li>").appendTo(ul).html(text).data("ind", i);
                if (opt.is(":selected")) {
                    li.addClass("selected");
                }
            });
            ul.on({
                mousedown: function () {
                    var ind = $(this).data("ind");
                    optionsElm.prop("selected", false).eq(ind).prop("selected", true);
                    select.trigger("change");
                    ul.trigger("overlayMenu.hide");
                }
            }, "li");
            ul.on({
                "overlayMenu.hide": function () {
                    var opt = select.find(":selected");
                    ul = null;
                    $elm.removeClass("focus");
                }
            });
            ul.uiOverlayMenu({
                target: $elm,
                x: $elm.offset().left + "px",
                y: $elm.offset().top + $elm.outerHeight(true) + "px"
            }).parent().addClass("ui-select-menu");
            $elm.addClass("focus");
        }

        if (options.overlay) {
            select.hide();

            $elm.on({
                mousedown: function () {
                    if (ul) {
                        ul.trigger("overlayMenu.hide");
                    } else {
                        showOverlay();
                    }
                }
            });
        }

        function updateUi() {
            var option = select.find("option:selected");
            var text = option.text();
            if (option.data("html")) {
                text = option.data("html");
            }
            selectValue.html(text);
        }


        updateUi();
        select.on({
            change: function () {
                updateUi();
                if (options.menu) {
                    location.href = select.val();
                }
            },
            focus: function () {
                $elm.addClass("focus");
            },
            blur: function () {
                $elm.removeClass("focus");
            }
        });
        $elm.on({
            updateUi: function () {
                updateUi();
            }
        });
    });
};


},{"../utils/parseData":16}],13:[function(require,module,exports){
$.fn.uiSiteScroll = function (options) {
    options = $.extend({}, options);
    return this.each(function () {
        var $elm = $(this);
        var SCROLLBAR_WIDTH = require("./metrics").getScrollBarWidth();
        var scrollTop = $(window).scrollTop();
        // var overlay = $('<div>').css({
        //     position: "fixed",
        //     height: "100vh",
        //     width: "100vw",
        //     top: 0,
        //     left: 0,
        //     overflow: "scroll",
        //     display: "none",
        //     background: "rgba(0, 0, 0, 0.5)",
        //     zIndex: 99
        // }).appendTo("body");
        $(".ui-siteScroll-page").css({minHeight: "100vh"});
        var direction = 1;

        var slide = -1;
        var bump = 0;
        var animating = false;

        function goToSlide(eq) {

            // overlay.show();
            // console.log("slide " + slide + " > " + eq);
            var pages = $(".ui-siteScroll-page");
            var size = pages.length;
            var page = pages.eq(eq);
            if (eq === -1 || page.length === 0) {
                return;
            }
            var top = page.position().top;
            var height = page.outerHeight(false);
            var wh = $(window).height();
            if (eq === slide) {
                bump = 0;
                // console.log("gotoslide", eq, scrollTop < top, scrollTop > top + height - wh);
                if (scrollTop < top) {
                    scrollAnimate(top);
                } else if (scrollTop > top + height - wh) {
                    scrollAnimate(top + height - wh);
                }
            } else {
                slide = eq;
                bump = 0;
                var st = top;
                if (direction < 0 && slide > 0) {
                    st += height - wh;
                    if (height > wh) {
                        bump = top;
                    }
                    // console.log(height - $(window).height())
                } else if (direction > 0 && slide < size - 1) {
                    if (height > wh) {
                        bump = top + height - wh;
                    }
                }
                scrollAnimate(st);
            }

        }

        function getSlideAfterScroll() {
            // animating = true;

            var sh = $(window).height();
            var pageFound = false;
            $(".ui-siteScroll-page").each(function () {
                var top = $(this).position().top;
                var height = $(this).outerHeight(false);
                if (direction === 1) {
                    // console.log("direction", {direction: direction, height: height, top: top, scrollTop: scrollTop});
                    if (scrollTop + sh > top && scrollTop < top) {
                        // console.log("getSlideAfterScroll", $(this).find(".pageNumber").text());
                        goToSlide($(this).index(".ui-siteScroll-page"));
                        pageFound = true;
                    }
                } else {
                    // console.log("direction", {direction: direction, height: height, top: top, scrollTop: scrollTop});
                    if (scrollTop + sh > top + height && scrollTop < top + height) {
                        // console.log("getSlideAfterScroll", $(this).find(".pageNumber").text());
                        goToSlide($(this).index(".ui-siteScroll-page"));
                        pageFound = true;
                    }
                }

            });
            if (!pageFound) {
                // animating = false;
            }
        }

        // setInterval(getSlideAfterScroll, 50);

        function scrollAnimate(st) {
            if (tm) {
                clearTimeout(tm);
            }
            // if (animating) {
            //     return;
            // }
            animating = true;
            // console.log("animate", {top: st, scrollTop: scrollTop, bump: bump, direction: direction}, st, scrollTop);
            var htmlBody = $("html, body");
            // $(window).css({paddingRight: SCROLLBAR_WIDTH + "px", overflow: "hidden"});
            TweenLite.killTweensOf(window);
            TweenLite.to(window, Math.min(Math.abs(st - scrollTop) * 1.2 / 1000, 2), {
                ease: Power2.easeOut,
                scrollTo: st, onComplete: function () {
                    // console.log("animation stop");

                    setTimeout(function () {
                        // console.log("animation released");
                        animating = false;
                        // $(window).css({paddingRight: "", overflow: ""});
                    }, 50)

                }
            });

            // .animate({scrollTop: st + "px"},
            //     Math.abs(st - scrollTop) * 6, function () {
            //         // overlay.hide();
            //         $("body").css({paddingRight: ""});
            //         htmlBody.css({
            //             overflow: ""
            //         });
            //         console.log("animation stop");
            //         animating = false;
            //     })
        }


        setInterval(function () {
            var st = $(window).scrollTop();
            if (st === scrollTop) {
                goToSlide(slide);
                return;
            }
            if (st >= scrollTop) {
                if (direction === -1) {
                    bump = 0;
                }
                direction = 1;
            } else {
                if (direction === 1) {
                    bump = 0;
                }
                direction = -1;
            }
            scrollTop = st;
            if (tm) {
                clearTimeout(tm);
            }
            if (bump > 0) {

                if (direction === -1 && bump > scrollTop) {
                    // console.log("bump -1", {direction: direction, bump: bump, scrollTop: scrollTop});
                    // animating = true;
                    scrollAnimate(bump);
                    bump = 0;
                    return;
                } else if (direction === 1 && bump < scrollTop) {
                    // console.log("bump 1", {direction: direction, bump: bump, scrollTop: scrollTop});
                    // animating = true;
                    scrollAnimate(bump);
                    bump = 0;

                }
                return;
            }
            // console.log("set tm", bump);
            // if (!animating){
            tm = setTimeout(getSlideAfterScroll, 50);
        }, 100);
        var tm;
        $(window).on("scroll", function (e) {
            if (tm) {
                clearTimeout(tm);
            }
            // }

        });

        tm = setTimeout(getSlideAfterScroll, 50);
        var ui = {
            goToSlide: function (slide) {
                goToSlide(slide);
            }
        };
        $elm.data("ui", ui);

    });
};



},{"./metrics":9}],14:[function(require,module,exports){
var _ = require("underscore");
function getDataNumber(elm, prop, def) {
    var val = parseInt($(elm).data(prop), 10);
    return isNaN(val) ? def : val;
}

function getDataNumberFloat(elm, prop, def) {
    var val = parseFloat($(elm).data(prop), 10);
    return isNaN(val) ? def : val;
}

function getDataBol(elm, prop, def) {
    var val = $(elm).data(prop);
    return val == "true" || val == "1";
}

function Slider(elm, options) {
    options.decimals = getDataNumber(elm, "decimals", false);
    options = $.extend({
        min: options.decimals ? getDataNumberFloat(elm, "min", 0) * Math.pow(10, options.decimals) : getDataNumber(elm, "min", 0),
        max: options.decimals ? getDataNumberFloat(elm, "max", 100) * Math.pow(10, options.decimals) : getDataNumber(elm, "max", 100),
        leftVal: options.decimals ? getDataNumberFloat(elm, "leftval", 0) * Math.pow(10, options.decimals) : getDataNumber(elm, "leftval", 0),
        rightVal: options.decimals ? getDataNumberFloat(elm, "rightval", 0) * Math.pow(10, options.decimals) : getDataNumber(elm, "rightval", 0),
        speed: 0.5,
        unit: "",
        ruler: getDataBol(elm, "ruler", false),
        moveRight: getDataBol(elm, "moveright", false)
    }, options);
    var $elm = $(elm), $content = $elm.find(".ui-slider-content"),
        $left = $elm.find(".ui-slider-left"),
        $right = $elm.find(".ui-slider-right"),
        $ticks = $elm.find(".ui-slider-tick"),
        width = $elm.find(".ui-slider-holder").width();
    if ($elm.data("unit")) {
        options.unit = $elm.data("unit");
    }
    $elm.addClass("ui-slider-v2");

    function checkDecimals(num, type) {
        return options.decimals ? num / Math.pow(10, options.decimals) : num;
    }

    if (options.ruler) {
        var $ruler = $('<div class="ui-slider-ruler"></div>');
        var half = width / 2;
        $ruler.append('<div class="ui-slider-ruler-mark first">' + getValue(0) + '</div>');
        $ruler.append('<div class="ui-slider-ruler-mark second">' + checkDecimals(getValue(half / 2)) + '</div>');
        $ruler.append('<div class="ui-slider-ruler-mark middle">' + checkDecimals(getValue(half)) + '</div>');
        $ruler.append('<div class="ui-slider-ruler-mark forth">' + checkDecimals(getValue(half + half / 2)) + '</div>');
        $ruler.append('<div class="ui-slider-ruler-mark last">' + checkDecimals(getValue(width)) + '</div>');

        $elm.append($ruler);
    }

    function getValue(l1) {
        return options.min + Math.round(l1 / width * (options.max - options.min));
    }

    function boundLeft(l1) {
        if (l1 < 0) {
            return 0;
        }
        if ($right.length) {
            var l2 = $right.position().left;
            if (l1 > l2) {
                return l2;
            }
        }
        if (l1 > width) {
            return width;
        }
        return l1;
    }

    function getSnapX(l1) {
        var left, a1, a2 = false, tick;
        $ticks.each(function () {
            a1 = Math.abs($(this).position().left - l1);
            if (a2 === false || a1 < a2) {
                tick = this;
                left = $(this).position().left;
                a2 = a1;
            }
        });
        if ($ticks.length == 0) {
            return {left: (getValue(l1) - options.min) / (options.max - options.min) * width}
        }
        return {left: left};
    }

    function getSnap($handle) {
        return $.extend({tick: $handle}, getSnapX($handle.position().left));
    }

    function boundRight(l1) {
        if (l1 > width) {
            return width;
        }
        if ($left.length) {
            var l2 = $left.position().left;
            if (l1 < l2) {
                return l2;
            }
        }
        if (l1 < 0) {
            return 0;
        }

        return l1;
    }

    function update() {
        width = $elm.find(".ui-slider-holder").width();
        var valLeft = options.decimals ? getDataNumberFloat($left, "val", options.min) * Math.pow(10, options.decimals) : getDataNumber($left, "val", options.min),
            left = (valLeft - options.min ) / (options.max - options.min) * width,
            valRight = options.decimals ? getDataNumberFloat($right, "val", options.max) * Math.pow(10, options.decimals) : getDataNumber($right, "val", options.max),
            right = (valRight - options.min) / (options.max - options.min) * width;
        var val;
        if ($left.length) {
            $left.css({left: left + "px"});
            val = checkDecimals(Math.round(valLeft));
            $left.find(".ui-slider-label").text(val + options.unit)
        }
        if ($right.length) {
            $right.css({left: right + "px"});
            val = checkDecimals(Math.round(valRight));
            $right.find(".ui-slider-label").text(val + options.unit);
        }
        if ($content.length) {
            $content.css({left: left + "px", right: width - right + "px"});
        }
        $ticks.each(function () {
            var val1 = options.decimals ? getDataNumberFloat(this, "val", options.min) * Math.pow(10, options.decimals) : getDataNumber(this, "val", options.min),
                val2 = (val1 - options.min ) / (options.max - options.min) * width;
            $(this).css({left: val2 + "px"});
            val = checkDecimals(Math.round(val1));
            $(this).find(".ui-slider-label").text(val + options.unit);
        });
    }

    $elm.on({
        mousedown: function (e) {
            if ($(e.target).closest(".ui-slider-right, .ui-slider-left").size() > 0) {
                return;
            }
            var left = e.pageX - $elm.find(".ui-slider-holder").offset().left, snap;
            if ($left.length && !options.moveRight) {
                snap = getSnapX(left);
                left = snap.left;
                TweenLite.to($left, options.speed, {css: {left: left + "px"}, ease: Power2.easeOut});
                if ($content.length) {
                    TweenLite.to($content, options.speed, {css: {left: left + "px"}, ease: Power2.easeOut});
                }
                setValue($left, getValue(left));
            } else if ($right.length) {
                snap = getSnapX(left);
                left = snap.left;
                TweenLite.to($right, options.speed, {css: {left: left + "px"}, ease: Power2.easeOut});
                if ($content.length) {
                    TweenLite.to($content, options.speed, {css: {right: width - left + "px"}, ease: Power2.easeOut});
                }
                setValue($right, getValue(left));
            }

        }
    });


    $elm.addClass("destroy").on({
        updateUi: function (e) {
            e.stopPropagation();
            update();
        },
        destroy: function () {
            $(window).off({resize: resize});
        }
    });

    function resize() {
        update();
    }
    
    update();

    $(window).on({
        resize: resize
    });
    function setValue($node, val, noTrigger) {
        if ($node.data("val") !== val) {
            if (options.decimals) {
                val = Math.round(val) / Math.pow(10, options.decimals);
            }
            $node.data("val", val);
            $node.find(".ui-slider-label").text(val + options.unit);
            if (!noTrigger) {
                $node.trigger("slider.change", [val]);
            }
        }
    }

    $left.onMouse({
        "mouse.start": function (e, pos) {
            pos.preventDefault();
            pos.data.left = $left.position().left;
        },
        "mouse.move": function (e, pos) {
            var diff = pos.diff();
            var l1 = boundLeft(pos.data.left + diff.x);
            $left.css({left: l1 + "px"});
            setValue($left, getValue(l1));
            if ($content.length) {
                $content.css({left: l1 + "px"});
            }
        },
        "mouse.stop": function () {
            var snap = getSnap($left);
            if (snap.tick) {
                setValue($left, getValue(snap.left));
                TweenLite.to(this, options.speed, {css: {left: snap.left + "px"}, ease: Power2.easeIn});
                if ($content.length) {
                    TweenLite.to($content, options.speed, {css: {left: snap.left + "px"}, ease: Power2.easeIn});
                }
            }
        }
    });
    $right.onMouse({
        "mouse.start": function (e, pos) {
            pos.data.left = $right.position().left;
            pos.preventDefault();

        },
        "mouse.move": function (e, pos) {
            var diff = pos.diff();
            var l1 = boundRight(pos.data.left + diff.x);
            $right.css({left: l1 + "px"});
            setValue($right, getValue(l1));
            if ($content.length) {
                $content.css({right: width - l1 + "px"});
            }
        },
        "mouse.stop": function () {
            var snap = getSnap($right);
            if (snap.tick) {
                setValue($right, getValue(snap.left));
                TweenLite.to(this, options.speed, {css: {left: snap.left + "px"}, ease: Power2.easeIn});
                if ($content.length) {
                    TweenLite.to($content, options.speed, {
                        css: {right: width - snap.left + "px"},
                        ease: Power2.easeIn
                    });
                }
            }
        }
    });


}


$.fn.uiSlider = function (options) {
    options = $.extend({v: 1}, options);
    options.v = 2;
    return this.each(function () {
        new Slider(this, options);
    });
};
},{"underscore":1}],15:[function(require,module,exports){
var parseData = require("../utils/parseData");
$.fn.uiTabs = function (options) {
    return this.each(function () {
        var options = $.extend({hover: false, showControllers: false}, options);
        var elm = this;
        options.hover = parseData.getBoolean(this, "hover", false);
        options.showControllers = parseData.getBoolean(this, "showcontrollers", false);

        $(".ui-tabs-content", elm).each(function () {
            if ($(this).closest(".ui-tabs").is($(elm))) {
                $(this).hide();
            }
        });
        function action($head) {
            var ind = $head.parent().index();
            $head.closest(".ui-tabs-header").find("li").removeClass("selected").children().removeClass("selected");
            $head.parent().addClass("selected").children().addClass("selected");

            var content = $head.closest(".ui-tabs-header").next().find(".ui-tabs-content").filter(function () {
                return $(this).closest(".ui-tabs").is($(elm));
            });

            // var content = $("> .ui-tabs-body", $head.closest(".ui-tabs")).find(".ui-tabs-content").filter(function () {
            //     return $(this).closest(".ui-tabs").is($(elm));
            // });

            content.hide();
            content.eq(ind).show().trigger("tab.contentVisible");
            content.find(".show").trigger("show");
            $(elm).trigger("tab.change");
            return false;
        }

        if (options.showControllers) {
            $(".ui-tabs-header", elm).each(function () {
                var tabs = $(this).closest(".ui-tabs");
                if (tabs.is($(elm))) {
                    var header = $(this);
                    var controllers = $('<div class="ui-tabs-controllers"></div>');
                    var left = $('<div class="ui-tabs-controller left"><</div>');
                    var right = $('<div class="ui-tabs-controller right">></div>');
                    controllers.append(left);
                    controllers.append(right);
                    header.append(controllers);
                    left.click(function () {
                        var cur = header.find("li.selected").index();
                        if (cur == 0) {
                            goToEq(header, header.find("li").length - 1);
                        } else {
                            goToEq(header, cur - 1);
                        }
                    });
                    right.click(function () {
                        var cur = header.find("li.selected").index();
                        if (cur == header.find("li").length - 1) {
                            goToEq(header, 0);
                        } else {
                            goToEq(header, cur + 1);
                        }
                    });
                }
            });
        }

        if (options.hover) {
            $(".ui-tabs-header a", elm).each(function () {
                var tabs = $(this).closest(".ui-tabs");
                if (tabs.is($(elm))) {
                    $(this).mouseenter(function () {
                        return action($(this));
                    });
                    if (!tabs.data("inited") && $(this).parent().hasClass("selected")) {
                        tabs.data("inited", true);
                        $(this).trigger("mouseenter");
                    }
                }
            })
        } else {
            $(".ui-tabs-header a", elm).each(function () {
                var tabs = $(this).closest(".ui-tabs");
                if (tabs.is($(elm))) {
                    $(this).click(function () {
                        return action($(this));
                    });
                    if (!tabs.data("inited") && $(this).parent().hasClass("selected")) {
                        tabs.data("inited", true);
                        $(this).trigger("click");
                    }
                }
            });
        }

        if (!$(elm).data("inited")) {
            $(".ui-tabs-header a", elm).each(function () {
                var tabs = $(this).closest(".ui-tabs");
                if (tabs.is($(elm)) && !tabs.data("inited")) {
                    tabs.data("inited", true);
                    if (options.hover) {
                        $(this).trigger("mouseenter");
                    } else {
                        $(this).trigger("click");
                    }
                }
            });
        }

        function goToEq(header, eq) {
            header.find("li").eq(eq).find("a").trigger(options.hover ? "mouseenter" : "click");
        }
    });
};




},{"../utils/parseData":16}],16:[function(require,module,exports){
var _ = require("underscore");

exports.getNumber = function (elm, prop, def) {
    def = def || 0;
    var val = Number($(elm).data(prop));
    return isNaN(val) ? def : val;
};


exports.getBoolean = function (elm, prop, def) {
    var val = $(elm).data(prop);
    if (_.isUndefined(val)) {
        return !!def;
    }
    return true;
};

exports.getString = function (elm, prop, def) {
    def = def || "";
    var val = $(elm).data(prop);
    if (_.isUndefined(val)) {
        return def;
    }
    return val;
};

exports.getUrlParameter = function getUrlParameter(sParam) {
    var sPageURL = decodeURIComponent(window.location.search.substring(1)),
        sURLVariables = sPageURL.split('&'),
        sParameterName,
        i;

    for (i = 0; i < sURLVariables.length; i++) {
        sParameterName = sURLVariables[i].split('=');

        if (sParameterName[0] === sParam) {
            return sParameterName[1] === undefined ? true : sParameterName[1];
        }
    }
};
},{"underscore":1}],17:[function(require,module,exports){
/*! Hammer.JS - v1.1.3 - 2014-05-22
 * http://eightmedia.github.io/hammer.js
 *
 * Copyright (c) 2014 Jorik Tangelder <j.tangelder@gmail.com>;
 * Licensed under the MIT license */

(function(window, undefined) {
  'use strict';

/**
 * @main
 * @module hammer
 *
 * @class Hammer
 * @static
 */

/**
 * Hammer, use this to create instances
 * ````
 * var hammertime = new Hammer(myElement);
 * ````
 *
 * @method Hammer
 * @param {HTMLElement} element
 * @param {Object} [options={}]
 * @return {Hammer.Instance}
 */
var Hammer = function Hammer(element, options) {
    return new Hammer.Instance(element, options || {});
};

/**
 * version, as defined in package.json
 * the value will be set at each build
 * @property VERSION
 * @final
 * @type {String}
 */
Hammer.VERSION = '1.1.3';

/**
 * default settings.
 * more settings are defined per gesture at `/gestures`. Each gesture can be disabled/enabled
 * by setting it's name (like `swipe`) to false.
 * You can set the defaults for all instances by changing this object before creating an instance.
 * @example
 * ````
 *  Hammer.defaults.drag = false;
 *  Hammer.defaults.behavior.touchAction = 'pan-y';
 *  delete Hammer.defaults.behavior.userSelect;
 * ````
 * @property defaults
 * @type {Object}
 */
Hammer.defaults = {
    /**
     * this setting object adds styles and attributes to the element to prevent the browser from doing
     * its native behavior. The css properties are auto prefixed for the browsers when needed.
     * @property defaults.behavior
     * @type {Object}
     */
    behavior: {
        /**
         * Disables text selection to improve the dragging gesture. When the value is `none` it also sets
         * `onselectstart=false` for IE on the element. Mainly for desktop browsers.
         * @property defaults.behavior.userSelect
         * @type {String}
         * @default 'none'
         */
        userSelect: 'none',

        /**
         * Specifies whether and how a given region can be manipulated by the user (for instance, by panning or zooming).
         * Used by Chrome 35> and IE10>. By default this makes the element blocking any touch event.
         * @property defaults.behavior.touchAction
         * @type {String}
         * @default: 'pan-y'
         */
        touchAction: 'pan-y',

        /**
         * Disables the default callout shown when you touch and hold a touch target.
         * On iOS, when you touch and hold a touch target such as a link, Safari displays
         * a callout containing information about the link. This property allows you to disable that callout.
         * @property defaults.behavior.touchCallout
         * @type {String}
         * @default 'none'
         */
        touchCallout: 'none',

        /**
         * Specifies whether zooming is enabled. Used by IE10>
         * @property defaults.behavior.contentZooming
         * @type {String}
         * @default 'none'
         */
        contentZooming: 'none',

        /**
         * Specifies that an entire element should be draggable instead of its contents.
         * Mainly for desktop browsers.
         * @property defaults.behavior.userDrag
         * @type {String}
         * @default 'none'
         */
        userDrag: 'none',

        /**
         * Overrides the highlight color shown when the user taps a link or a JavaScript
         * clickable element in Safari on iPhone. This property obeys the alpha value, if specified.
         *
         * If you don't specify an alpha value, Safari on iPhone applies a default alpha value
         * to the color. To disable tap highlighting, set the alpha value to 0 (invisible).
         * If you set the alpha value to 1.0 (opaque), the element is not visible when tapped.
         * @property defaults.behavior.tapHighlightColor
         * @type {String}
         * @default 'rgba(0,0,0,0)'
         */
        tapHighlightColor: 'rgba(0,0,0,0)'
    }
};

/**
 * hammer document where the base events are added at
 * @property DOCUMENT
 * @type {HTMLElement}
 * @default window.document
 */
Hammer.DOCUMENT = document;

/**
 * detect support for pointer events
 * @property HAS_POINTEREVENTS
 * @type {Boolean}
 */
Hammer.HAS_POINTEREVENTS = navigator.pointerEnabled || navigator.msPointerEnabled;

/**
 * detect support for touch events
 * @property HAS_TOUCHEVENTS
 * @type {Boolean}
 */
Hammer.HAS_TOUCHEVENTS = ('ontouchstart' in window);

/**
 * detect mobile browsers
 * @property IS_MOBILE
 * @type {Boolean}
 */
Hammer.IS_MOBILE = /mobile|tablet|ip(ad|hone|od)|android|silk/i.test(navigator.userAgent);

/**
 * detect if we want to support mouseevents at all
 * @property NO_MOUSEEVENTS
 * @type {Boolean}
 */
Hammer.NO_MOUSEEVENTS = (Hammer.HAS_TOUCHEVENTS && Hammer.IS_MOBILE) || Hammer.HAS_POINTEREVENTS;

/**
 * interval in which Hammer recalculates current velocity/direction/angle in ms
 * @property CALCULATE_INTERVAL
 * @type {Number}
 * @default 25
 */
Hammer.CALCULATE_INTERVAL = 25;

/**
 * eventtypes per touchevent (start, move, end) are filled by `Event.determineEventTypes` on `setup`
 * the object contains the DOM event names per type (`EVENT_START`, `EVENT_MOVE`, `EVENT_END`)
 * @property EVENT_TYPES
 * @private
 * @writeOnce
 * @type {Object}
 */
var EVENT_TYPES = {};

/**
 * direction strings, for safe comparisons
 * @property DIRECTION_DOWN|LEFT|UP|RIGHT
 * @final
 * @type {String}
 * @default 'down' 'left' 'up' 'right'
 */
var DIRECTION_DOWN = Hammer.DIRECTION_DOWN = 'down';
var DIRECTION_LEFT = Hammer.DIRECTION_LEFT = 'left';
var DIRECTION_UP = Hammer.DIRECTION_UP = 'up';
var DIRECTION_RIGHT = Hammer.DIRECTION_RIGHT = 'right';

/**
 * pointertype strings, for safe comparisons
 * @property POINTER_MOUSE|TOUCH|PEN
 * @final
 * @type {String}
 * @default 'mouse' 'touch' 'pen'
 */
var POINTER_MOUSE = Hammer.POINTER_MOUSE = 'mouse';
var POINTER_TOUCH = Hammer.POINTER_TOUCH = 'touch';
var POINTER_PEN = Hammer.POINTER_PEN = 'pen';

/**
 * eventtypes
 * @property EVENT_START|MOVE|END|RELEASE|TOUCH
 * @final
 * @type {String}
 * @default 'start' 'change' 'move' 'end' 'release' 'touch'
 */
var EVENT_START = Hammer.EVENT_START = 'start';
var EVENT_MOVE = Hammer.EVENT_MOVE = 'move';
var EVENT_END = Hammer.EVENT_END = 'end';
var EVENT_RELEASE = Hammer.EVENT_RELEASE = 'release';
var EVENT_TOUCH = Hammer.EVENT_TOUCH = 'touch';

/**
 * if the window events are set...
 * @property READY
 * @writeOnce
 * @type {Boolean}
 * @default false
 */
Hammer.READY = false;

/**
 * plugins namespace
 * @property plugins
 * @type {Object}
 */
Hammer.plugins = Hammer.plugins || {};

/**
 * gestures namespace
 * see `/gestures` for the definitions
 * @property gestures
 * @type {Object}
 */
Hammer.gestures = Hammer.gestures || {};

/**
 * setup events to detect gestures on the document
 * this function is called when creating an new instance
 * @private
 */
function setup() {
    if(Hammer.READY) {
        return;
    }

    // find what eventtypes we add listeners to
    Event.determineEventTypes();

    // Register all gestures inside Hammer.gestures
    Utils.each(Hammer.gestures, function(gesture) {
        Detection.register(gesture);
    });

    // Add touch events on the document
    Event.onTouch(Hammer.DOCUMENT, EVENT_MOVE, Detection.detect);
    Event.onTouch(Hammer.DOCUMENT, EVENT_END, Detection.detect);

    // Hammer is ready...!
    Hammer.READY = true;
}

/**
 * @module hammer
 *
 * @class Utils
 * @static
 */
var Utils = Hammer.utils = {
    /**
     * extend method, could also be used for cloning when `dest` is an empty object.
     * changes the dest object
     * @method extend
     * @param {Object} dest
     * @param {Object} src
     * @param {Boolean} [merge=false]  do a merge
     * @return {Object} dest
     */
    extend: function extend(dest, src, merge) {
        for(var key in src) {
            if(!src.hasOwnProperty(key) || (dest[key] !== undefined && merge)) {
                continue;
            }
            dest[key] = src[key];
        }
        return dest;
    },

    /**
     * simple addEventListener wrapper
     * @method on
     * @param {HTMLElement} element
     * @param {String} type
     * @param {Function} handler
     */
    on: function on(element, type, handler) {
        element.addEventListener(type, handler, false);
    },

    /**
     * simple removeEventListener wrapper
     * @method off
     * @param {HTMLElement} element
     * @param {String} type
     * @param {Function} handler
     */
    off: function off(element, type, handler) {
        element.removeEventListener(type, handler, false);
    },

    /**
     * forEach over arrays and objects
     * @method each
     * @param {Object|Array} obj
     * @param {Function} iterator
     * @param {any} iterator.item
     * @param {Number} iterator.index
     * @param {Object|Array} iterator.obj the source object
     * @param {Object} context value to use as `this` in the iterator
     */
    each: function each(obj, iterator, context) {
        var i, len;

        // native forEach on arrays
        if('forEach' in obj) {
            obj.forEach(iterator, context);
        // arrays
        } else if(obj.length !== undefined) {
            for(i = 0, len = obj.length; i < len; i++) {
                if(iterator.call(context, obj[i], i, obj) === false) {
                    return;
                }
            }
        // objects
        } else {
            for(i in obj) {
                if(obj.hasOwnProperty(i) &&
                    iterator.call(context, obj[i], i, obj) === false) {
                    return;
                }
            }
        }
    },

    /**
     * find if a string contains the string using indexOf
     * @method inStr
     * @param {String} src
     * @param {String} find
     * @return {Boolean} found
     */
    inStr: function inStr(src, find) {
        return src.indexOf(find) > -1;
    },

    /**
     * find if a array contains the object using indexOf or a simple polyfill
     * @method inArray
     * @param {String} src
     * @param {String} find
     * @return {Boolean|Number} false when not found, or the index
     */
    inArray: function inArray(src, find) {
        if(src.indexOf) {
            var index = src.indexOf(find);
            return (index === -1) ? false : index;
        } else {
            for(var i = 0, len = src.length; i < len; i++) {
                if(src[i] === find) {
                    return i;
                }
            }
            return false;
        }
    },

    /**
     * convert an array-like object (`arguments`, `touchlist`) to an array
     * @method toArray
     * @param {Object} obj
     * @return {Array}
     */
    toArray: function toArray(obj) {
        return Array.prototype.slice.call(obj, 0);
    },

    /**
     * find if a node is in the given parent
     * @method hasParent
     * @param {HTMLElement} node
     * @param {HTMLElement} parent
     * @return {Boolean} found
     */
    hasParent: function hasParent(node, parent) {
        while(node) {
            if(node == parent) {
                return true;
            }
            node = node.parentNode;
        }
        return false;
    },

    /**
     * get the center of all the touches
     * @method getCenter
     * @param {Array} touches
     * @return {Object} center contains `pageX`, `pageY`, `clientX` and `clientY` properties
     */
    getCenter: function getCenter(touches) {
        var pageX = [],
            pageY = [],
            clientX = [],
            clientY = [],
            min = Math.min,
            max = Math.max;

        // no need to loop when only one touch
        if(touches.length === 1) {
            return {
                pageX: touches[0].pageX,
                pageY: touches[0].pageY,
                clientX: touches[0].clientX,
                clientY: touches[0].clientY
            };
        }

        Utils.each(touches, function(touch) {
            pageX.push(touch.pageX);
            pageY.push(touch.pageY);
            clientX.push(touch.clientX);
            clientY.push(touch.clientY);
        });

        return {
            pageX: (min.apply(Math, pageX) + max.apply(Math, pageX)) / 2,
            pageY: (min.apply(Math, pageY) + max.apply(Math, pageY)) / 2,
            clientX: (min.apply(Math, clientX) + max.apply(Math, clientX)) / 2,
            clientY: (min.apply(Math, clientY) + max.apply(Math, clientY)) / 2
        };
    },

    /**
     * calculate the velocity between two points. unit is in px per ms.
     * @method getVelocity
     * @param {Number} deltaTime
     * @param {Number} deltaX
     * @param {Number} deltaY
     * @return {Object} velocity `x` and `y`
     */
    getVelocity: function getVelocity(deltaTime, deltaX, deltaY) {
        return {
            x: Math.abs(deltaX / deltaTime) || 0,
            y: Math.abs(deltaY / deltaTime) || 0
        };
    },

    /**
     * calculate the angle between two coordinates
     * @method getAngle
     * @param {Touch} touch1
     * @param {Touch} touch2
     * @return {Number} angle
     */
    getAngle: function getAngle(touch1, touch2) {
        var x = touch2.clientX - touch1.clientX,
            y = touch2.clientY - touch1.clientY;

        return Math.atan2(y, x) * 180 / Math.PI;
    },

    /**
     * do a small comparision to get the direction between two touches.
     * @method getDirection
     * @param {Touch} touch1
     * @param {Touch} touch2
     * @return {String} direction matches `DIRECTION_LEFT|RIGHT|UP|DOWN`
     */
    getDirection: function getDirection(touch1, touch2) {
        var x = Math.abs(touch1.clientX - touch2.clientX),
            y = Math.abs(touch1.clientY - touch2.clientY);

        if(x >= y) {
            return touch1.clientX - touch2.clientX > 0 ? DIRECTION_LEFT : DIRECTION_RIGHT;
        }
        return touch1.clientY - touch2.clientY > 0 ? DIRECTION_UP : DIRECTION_DOWN;
    },

    /**
     * calculate the distance between two touches
     * @method getDistance
     * @param {Touch}touch1
     * @param {Touch} touch2
     * @return {Number} distance
     */
    getDistance: function getDistance(touch1, touch2) {
        var x = touch2.clientX - touch1.clientX,
            y = touch2.clientY - touch1.clientY;

        return Math.sqrt((x * x) + (y * y));
    },

    /**
     * calculate the scale factor between two touchLists
     * no scale is 1, and goes down to 0 when pinched together, and bigger when pinched out
     * @method getScale
     * @param {Array} start array of touches
     * @param {Array} end array of touches
     * @return {Number} scale
     */
    getScale: function getScale(start, end) {
        // need two fingers...
        if(start.length >= 2 && end.length >= 2) {
            return this.getDistance(end[0], end[1]) / this.getDistance(start[0], start[1]);
        }
        return 1;
    },

    /**
     * calculate the rotation degrees between two touchLists
     * @method getRotation
     * @param {Array} start array of touches
     * @param {Array} end array of touches
     * @return {Number} rotation
     */
    getRotation: function getRotation(start, end) {
        // need two fingers
        if(start.length >= 2 && end.length >= 2) {
            return this.getAngle(end[1], end[0]) - this.getAngle(start[1], start[0]);
        }
        return 0;
    },

    /**
     * find out if the direction is vertical   *
     * @method isVertical
     * @param {String} direction matches `DIRECTION_UP|DOWN`
     * @return {Boolean} is_vertical
     */
    isVertical: function isVertical(direction) {
        return direction == DIRECTION_UP || direction == DIRECTION_DOWN;
    },

    /**
     * set css properties with their prefixes
     * @param {HTMLElement} element
     * @param {String} prop
     * @param {String} value
     * @param {Boolean} [toggle=true]
     * @return {Boolean}
     */
    setPrefixedCss: function setPrefixedCss(element, prop, value, toggle) {
        var prefixes = ['', 'Webkit', 'Moz', 'O', 'ms'];
        prop = Utils.toCamelCase(prop);

        for(var i = 0; i < prefixes.length; i++) {
            var p = prop;
            // prefixes
            if(prefixes[i]) {
                p = prefixes[i] + p.slice(0, 1).toUpperCase() + p.slice(1);
            }

            // test the style
            if(p in element.style) {
                element.style[p] = (toggle == null || toggle) && value || '';
                break;
            }
        }
    },

    /**
     * toggle browser default behavior by setting css properties.
     * `userSelect='none'` also sets `element.onselectstart` to false
     * `userDrag='none'` also sets `element.ondragstart` to false
     *
     * @method toggleBehavior
     * @param {HtmlElement} element
     * @param {Object} props
     * @param {Boolean} [toggle=true]
     */
    toggleBehavior: function toggleBehavior(element, props, toggle) {
        if(!props || !element || !element.style) {
            return;
        }

        // set the css properties
        Utils.each(props, function(value, prop) {
            Utils.setPrefixedCss(element, prop, value, toggle);
        });

        var falseFn = toggle && function() {
            return false;
        };

        // also the disable onselectstart
        if(props.userSelect == 'none') {
            element.onselectstart = falseFn;
        }
        // and disable ondragstart
        if(props.userDrag == 'none') {
            element.ondragstart = falseFn;
        }
    },

    /**
     * convert a string with underscores to camelCase
     * so prevent_default becomes preventDefault
     * @param {String} str
     * @return {String} camelCaseStr
     */
    toCamelCase: function toCamelCase(str) {
        return str.replace(/[_-]([a-z])/g, function(s) {
            return s[1].toUpperCase();
        });
    }
};


/**
 * @module hammer
 */
/**
 * @class Event
 * @static
 */
var Event = Hammer.event = {
    /**
     * when touch events have been fired, this is true
     * this is used to stop mouse events
     * @property prevent_mouseevents
     * @private
     * @type {Boolean}
     */
    preventMouseEvents: false,

    /**
     * if EVENT_START has been fired
     * @property started
     * @private
     * @type {Boolean}
     */
    started: false,

    /**
     * when the mouse is hold down, this is true
     * @property should_detect
     * @private
     * @type {Boolean}
     */
    shouldDetect: false,

    /**
     * simple event binder with a hook and support for multiple types
     * @method on
     * @param {HTMLElement} element
     * @param {String} type
     * @param {Function} handler
     * @param {Function} [hook]
     * @param {Object} hook.type
     */
    on: function on(element, type, handler, hook) {
        var types = type.split(' ');
        Utils.each(types, function(type) {
            Utils.on(element, type, handler);
            hook && hook(type);
        });
    },

    /**
     * simple event unbinder with a hook and support for multiple types
     * @method off
     * @param {HTMLElement} element
     * @param {String} type
     * @param {Function} handler
     * @param {Function} [hook]
     * @param {Object} hook.type
     */
    off: function off(element, type, handler, hook) {
        var types = type.split(' ');
        Utils.each(types, function(type) {
            Utils.off(element, type, handler);
            hook && hook(type);
        });
    },

    /**
     * the core touch event handler.
     * this finds out if we should to detect gestures
     * @method onTouch
     * @param {HTMLElement} element
     * @param {String} eventType matches `EVENT_START|MOVE|END`
     * @param {Function} handler
     * @return onTouchHandler {Function} the core event handler
     */
    onTouch: function onTouch(element, eventType, handler) {
        var self = this;

        var onTouchHandler = function onTouchHandler(ev) {
            var srcType = ev.type.toLowerCase(),
                isPointer = Hammer.HAS_POINTEREVENTS,
                isMouse = Utils.inStr(srcType, 'mouse'),
                triggerType;

            // if we are in a mouseevent, but there has been a touchevent triggered in this session
            // we want to do nothing. simply break out of the event.
            if(isMouse && self.preventMouseEvents) {
                return;

            // mousebutton must be down
            } else if(isMouse && eventType == EVENT_START && ev.button === 0) {
                self.preventMouseEvents = false;
                self.shouldDetect = true;
            } else if(isPointer && eventType == EVENT_START) {
                self.shouldDetect = (ev.buttons === 1 || PointerEvent.matchType(POINTER_TOUCH, ev));
            // just a valid start event, but no mouse
            } else if(!isMouse && eventType == EVENT_START) {
                self.preventMouseEvents = true;
                self.shouldDetect = true;
            }

            // update the pointer event before entering the detection
            if(isPointer && eventType != EVENT_END) {
                PointerEvent.updatePointer(eventType, ev);
            }

            // we are in a touch/down state, so allowed detection of gestures
            if(self.shouldDetect) {
                triggerType = self.doDetect.call(self, ev, eventType, element, handler);
            }

            // ...and we are done with the detection
            // so reset everything to start each detection totally fresh
            if(triggerType == EVENT_END) {
                self.preventMouseEvents = false;
                self.shouldDetect = false;
                PointerEvent.reset();
            // update the pointerevent object after the detection
            }

            if(isPointer && eventType == EVENT_END) {
                PointerEvent.updatePointer(eventType, ev);
            }
        };

        this.on(element, EVENT_TYPES[eventType], onTouchHandler);
        return onTouchHandler;
    },

    /**
     * the core detection method
     * this finds out what hammer-touch-events to trigger
     * @method doDetect
     * @param {Object} ev
     * @param {String} eventType matches `EVENT_START|MOVE|END`
     * @param {HTMLElement} element
     * @param {Function} handler
     * @return {String} triggerType matches `EVENT_START|MOVE|END`
     */
    doDetect: function doDetect(ev, eventType, element, handler) {
        var touchList = this.getTouchList(ev, eventType);
        var touchListLength = touchList.length;
        var triggerType = eventType;
        var triggerChange = touchList.trigger; // used by fakeMultitouch plugin
        var changedLength = touchListLength;

        // at each touchstart-like event we want also want to trigger a TOUCH event...
        if(eventType == EVENT_START) {
            triggerChange = EVENT_TOUCH;
        // ...the same for a touchend-like event
        } else if(eventType == EVENT_END) {
            triggerChange = EVENT_RELEASE;

            // keep track of how many touches have been removed
            changedLength = touchList.length - ((ev.changedTouches) ? ev.changedTouches.length : 1);
        }

        // after there are still touches on the screen,
        // we just want to trigger a MOVE event. so change the START or END to a MOVE
        // but only after detection has been started, the first time we actualy want a START
        if(changedLength > 0 && this.started) {
            triggerType = EVENT_MOVE;
        }

        // detection has been started, we keep track of this, see above
        this.started = true;

        // generate some event data, some basic information
        var evData = this.collectEventData(element, triggerType, touchList, ev);

        // trigger the triggerType event before the change (TOUCH, RELEASE) events
        // but the END event should be at last
        if(eventType != EVENT_END) {
            handler.call(Detection, evData);
        }

        // trigger a change (TOUCH, RELEASE) event, this means the length of the touches changed
        if(triggerChange) {
            evData.changedLength = changedLength;
            evData.eventType = triggerChange;

            handler.call(Detection, evData);

            evData.eventType = triggerType;
            delete evData.changedLength;
        }

        // trigger the END event
        if(triggerType == EVENT_END) {
            handler.call(Detection, evData);

            // ...and we are done with the detection
            // so reset everything to start each detection totally fresh
            this.started = false;
        }

        return triggerType;
    },

    /**
     * we have different events for each device/browser
     * determine what we need and set them in the EVENT_TYPES constant
     * the `onTouch` method is bind to these properties.
     * @method determineEventTypes
     * @return {Object} events
     */
    determineEventTypes: function determineEventTypes() {
        var types;
        if(Hammer.HAS_POINTEREVENTS) {
            if(window.PointerEvent) {
                types = [
                    'pointerdown',
                    'pointermove',
                    'pointerup pointercancel lostpointercapture'
                ];
            } else {
                types = [
                    'MSPointerDown',
                    'MSPointerMove',
                    'MSPointerUp MSPointerCancel MSLostPointerCapture'
                ];
            }
        } else if(Hammer.NO_MOUSEEVENTS) {
            types = [
                'touchstart',
                'touchmove',
                'touchend touchcancel'
            ];
        } else {
            types = [
                'touchstart mousedown',
                'touchmove mousemove',
                'touchend touchcancel mouseup'
            ];
        }

        EVENT_TYPES[EVENT_START] = types[0];
        EVENT_TYPES[EVENT_MOVE] = types[1];
        EVENT_TYPES[EVENT_END] = types[2];
        return EVENT_TYPES;
    },

    /**
     * create touchList depending on the event
     * @method getTouchList
     * @param {Object} ev
     * @param {String} eventType
     * @return {Array} touches
     */
    getTouchList: function getTouchList(ev, eventType) {
        // get the fake pointerEvent touchlist
        if(Hammer.HAS_POINTEREVENTS) {
            return PointerEvent.getTouchList();
        }

        // get the touchlist
        if(ev.touches) {
            if(eventType == EVENT_MOVE) {
                return ev.touches;
            }

            var identifiers = [];
            var concat = [].concat(Utils.toArray(ev.touches), Utils.toArray(ev.changedTouches));
            var touchList = [];

            Utils.each(concat, function(touch) {
                if(Utils.inArray(identifiers, touch.identifier) === false) {
                    touchList.push(touch);
                }
                identifiers.push(touch.identifier);
            });

            return touchList;
        }

        // make fake touchList from mouse position
        ev.identifier = 1;
        return [ev];
    },

    /**
     * collect basic event data
     * @method collectEventData
     * @param {HTMLElement} element
     * @param {String} eventType matches `EVENT_START|MOVE|END`
     * @param {Array} touches
     * @param {Object} ev
     * @return {Object} ev
     */
    collectEventData: function collectEventData(element, eventType, touches, ev) {
        // find out pointerType
        var pointerType = POINTER_TOUCH;
        if(Utils.inStr(ev.type, 'mouse') || PointerEvent.matchType(POINTER_MOUSE, ev)) {
            pointerType = POINTER_MOUSE;
        } else if(PointerEvent.matchType(POINTER_PEN, ev)) {
            pointerType = POINTER_PEN;
        }

        return {
            center: Utils.getCenter(touches),
            timeStamp: Date.now(),
            target: ev.target,
            touches: touches,
            eventType: eventType,
            pointerType: pointerType,
            srcEvent: ev,

            /**
             * prevent the browser default actions
             * mostly used to disable scrolling of the browser
             */
            preventDefault: function() {
                var srcEvent = this.srcEvent;
                srcEvent.preventManipulation && srcEvent.preventManipulation();
                srcEvent.preventDefault && srcEvent.preventDefault();
            },

            /**
             * stop bubbling the event up to its parents
             */
            stopPropagation: function() {
                this.srcEvent.stopPropagation();
            },

            /**
             * immediately stop gesture detection
             * might be useful after a swipe was detected
             * @return {*}
             */
            stopDetect: function() {
                return Detection.stopDetect();
            }
        };
    }
};


/**
 * @module hammer
 *
 * @class PointerEvent
 * @static
 */
var PointerEvent = Hammer.PointerEvent = {
    /**
     * holds all pointers, by `identifier`
     * @property pointers
     * @type {Object}
     */
    pointers: {},

    /**
     * get the pointers as an array
     * @method getTouchList
     * @return {Array} touchlist
     */
    getTouchList: function getTouchList() {
        var touchlist = [];
        // we can use forEach since pointerEvents only is in IE10
        Utils.each(this.pointers, function(pointer) {
            touchlist.push(pointer);
        });

        return touchlist;
    },

    /**
     * update the position of a pointer
     * @method updatePointer
     * @param {String} eventType matches `EVENT_START|MOVE|END`
     * @param {Object} pointerEvent
     */
    updatePointer: function updatePointer(eventType, pointerEvent) {
        if(eventType == EVENT_END) {
            delete this.pointers[pointerEvent.pointerId];
        } else {
            pointerEvent.identifier = pointerEvent.pointerId;
            this.pointers[pointerEvent.pointerId] = pointerEvent;
        }
    },

    /**
     * check if ev matches pointertype
     * @method matchType
     * @param {String} pointerType matches `POINTER_MOUSE|TOUCH|PEN`
     * @param {PointerEvent} ev
     */
    matchType: function matchType(pointerType, ev) {
        if(!ev.pointerType) {
            return false;
        }

        var pt = ev.pointerType,
            types = {};

        types[POINTER_MOUSE] = (pt === (ev.MSPOINTER_TYPE_MOUSE || POINTER_MOUSE));
        types[POINTER_TOUCH] = (pt === (ev.MSPOINTER_TYPE_TOUCH || POINTER_TOUCH));
        types[POINTER_PEN] = (pt === (ev.MSPOINTER_TYPE_PEN || POINTER_PEN));
        return types[pointerType];
    },

    /**
     * reset the stored pointers
     * @method reset
     */
    reset: function resetList() {
        this.pointers = {};
    }
};


/**
 * @module hammer
 *
 * @class Detection
 * @static
 */
var Detection = Hammer.detection = {
    // contains all registred Hammer.gestures in the correct order
    gestures: [],

    // data of the current Hammer.gesture detection session
    current: null,

    // the previous Hammer.gesture session data
    // is a full clone of the previous gesture.current object
    previous: null,

    // when this becomes true, no gestures are fired
    stopped: false,

    /**
     * start Hammer.gesture detection
     * @method startDetect
     * @param {Hammer.Instance} inst
     * @param {Object} eventData
     */
    startDetect: function startDetect(inst, eventData) {
        // already busy with a Hammer.gesture detection on an element
        if(this.current) {
            return;
        }

        this.stopped = false;

        // holds current session
        this.current = {
            inst: inst, // reference to HammerInstance we're working for
            startEvent: Utils.extend({}, eventData), // start eventData for distances, timing etc
            lastEvent: false, // last eventData
            lastCalcEvent: false, // last eventData for calculations.
            futureCalcEvent: false, // last eventData for calculations.
            lastCalcData: {}, // last lastCalcData
            name: '' // current gesture we're in/detected, can be 'tap', 'hold' etc
        };

        this.detect(eventData);
    },

    /**
     * Hammer.gesture detection
     * @method detect
     * @param {Object} eventData
     * @return {any}
     */
    detect: function detect(eventData) {
        if(!this.current || this.stopped) {
            return;
        }

        // extend event data with calculations about scale, distance etc
        eventData = this.extendEventData(eventData);

        // hammer instance and instance options
        var inst = this.current.inst,
            instOptions = inst.options;

        // call Hammer.gesture handlers
        Utils.each(this.gestures, function triggerGesture(gesture) {
            // only when the instance options have enabled this gesture
            if(!this.stopped && inst.enabled && instOptions[gesture.name]) {
                gesture.handler.call(gesture, eventData, inst);
            }
        }, this);

        // store as previous event event
        if(this.current) {
            this.current.lastEvent = eventData;
        }

        if(eventData.eventType == EVENT_END) {
            this.stopDetect();
        }

        return eventData;
    },

    /**
     * clear the Hammer.gesture vars
     * this is called on endDetect, but can also be used when a final Hammer.gesture has been detected
     * to stop other Hammer.gestures from being fired
     * @method stopDetect
     */
    stopDetect: function stopDetect() {
        // clone current data to the store as the previous gesture
        // used for the double tap gesture, since this is an other gesture detect session
        this.previous = Utils.extend({}, this.current);

        // reset the current
        this.current = null;
        this.stopped = true;
    },

    /**
     * calculate velocity, angle and direction
     * @method getVelocityData
     * @param {Object} ev
     * @param {Object} center
     * @param {Number} deltaTime
     * @param {Number} deltaX
     * @param {Number} deltaY
     */
    getCalculatedData: function getCalculatedData(ev, center, deltaTime, deltaX, deltaY) {
        var cur = this.current,
            recalc = false,
            calcEv = cur.lastCalcEvent,
            calcData = cur.lastCalcData;

        if(calcEv && ev.timeStamp - calcEv.timeStamp > Hammer.CALCULATE_INTERVAL) {
            center = calcEv.center;
            deltaTime = ev.timeStamp - calcEv.timeStamp;
            deltaX = ev.center.clientX - calcEv.center.clientX;
            deltaY = ev.center.clientY - calcEv.center.clientY;
            recalc = true;
        }

        if(ev.eventType == EVENT_TOUCH || ev.eventType == EVENT_RELEASE) {
            cur.futureCalcEvent = ev;
        }

        if(!cur.lastCalcEvent || recalc) {
            calcData.velocity = Utils.getVelocity(deltaTime, deltaX, deltaY);
            calcData.angle = Utils.getAngle(center, ev.center);
            calcData.direction = Utils.getDirection(center, ev.center);

            cur.lastCalcEvent = cur.futureCalcEvent || ev;
            cur.futureCalcEvent = ev;
        }

        ev.velocityX = calcData.velocity.x;
        ev.velocityY = calcData.velocity.y;
        ev.interimAngle = calcData.angle;
        ev.interimDirection = calcData.direction;
    },

    /**
     * extend eventData for Hammer.gestures
     * @method extendEventData
     * @param {Object} ev
     * @return {Object} ev
     */
    extendEventData: function extendEventData(ev) {
        var cur = this.current,
            startEv = cur.startEvent,
            lastEv = cur.lastEvent || startEv;

        // update the start touchlist to calculate the scale/rotation
        if(ev.eventType == EVENT_TOUCH || ev.eventType == EVENT_RELEASE) {
            startEv.touches = [];
            Utils.each(ev.touches, function(touch) {
                startEv.touches.push({
                    clientX: touch.clientX,
                    clientY: touch.clientY
                });
            });
        }

        var deltaTime = ev.timeStamp - startEv.timeStamp,
            deltaX = ev.center.clientX - startEv.center.clientX,
            deltaY = ev.center.clientY - startEv.center.clientY;

        this.getCalculatedData(ev, lastEv.center, deltaTime, deltaX, deltaY);

        Utils.extend(ev, {
            startEvent: startEv,

            deltaTime: deltaTime,
            deltaX: deltaX,
            deltaY: deltaY,

            distance: Utils.getDistance(startEv.center, ev.center),
            angle: Utils.getAngle(startEv.center, ev.center),
            direction: Utils.getDirection(startEv.center, ev.center),
            scale: Utils.getScale(startEv.touches, ev.touches),
            rotation: Utils.getRotation(startEv.touches, ev.touches)
        });

        return ev;
    },

    /**
     * register new gesture
     * @method register
     * @param {Object} gesture object, see `gestures/` for documentation
     * @return {Array} gestures
     */
    register: function register(gesture) {
        // add an enable gesture options if there is no given
        var options = gesture.defaults || {};
        if(options[gesture.name] === undefined) {
            options[gesture.name] = true;
        }

        // extend Hammer default options with the Hammer.gesture options
        Utils.extend(Hammer.defaults, options, true);

        // set its index
        gesture.index = gesture.index || 1000;

        // add Hammer.gesture to the list
        this.gestures.push(gesture);

        // sort the list by index
        this.gestures.sort(function(a, b) {
            if(a.index < b.index) {
                return -1;
            }
            if(a.index > b.index) {
                return 1;
            }
            return 0;
        });

        return this.gestures;
    }
};


/**
 * @module hammer
 */

/**
 * create new hammer instance
 * all methods should return the instance itself, so it is chainable.
 *
 * @class Instance
 * @constructor
 * @param {HTMLElement} element
 * @param {Object} [options={}] options are merged with `Hammer.defaults`
 * @return {Hammer.Instance}
 */
Hammer.Instance = function(element, options) {
    var self = this;

    // setup HammerJS window events and register all gestures
    // this also sets up the default options
    setup();

    /**
     * @property element
     * @type {HTMLElement}
     */
    this.element = element;

    /**
     * @property enabled
     * @type {Boolean}
     * @protected
     */
    this.enabled = true;

    /**
     * options, merged with the defaults
     * options with an _ are converted to camelCase
     * @property options
     * @type {Object}
     */
    Utils.each(options, function(value, name) {
        delete options[name];
        options[Utils.toCamelCase(name)] = value;
    });

    this.options = Utils.extend(Utils.extend({}, Hammer.defaults), options || {});

    // add some css to the element to prevent the browser from doing its native behavoir
    if(this.options.behavior) {
        Utils.toggleBehavior(this.element, this.options.behavior, true);
    }

    /**
     * event start handler on the element to start the detection
     * @property eventStartHandler
     * @type {Object}
     */
    this.eventStartHandler = Event.onTouch(element, EVENT_START, function(ev) {
        if(self.enabled && ev.eventType == EVENT_START) {
            Detection.startDetect(self, ev);
        } else if(ev.eventType == EVENT_TOUCH) {
            Detection.detect(ev);
        }
    });

    /**
     * keep a list of user event handlers which needs to be removed when calling 'dispose'
     * @property eventHandlers
     * @type {Array}
     */
    this.eventHandlers = [];
};

Hammer.Instance.prototype = {
    /**
     * bind events to the instance
     * @method on
     * @chainable
     * @param {String} gestures multiple gestures by splitting with a space
     * @param {Function} handler
     * @param {Object} handler.ev event object
     */
    on: function onEvent(gestures, handler) {
        var self = this;
        Event.on(self.element, gestures, handler, function(type) {
            self.eventHandlers.push({ gesture: type, handler: handler });
        });
        return self;
    },

    /**
     * unbind events to the instance
     * @method off
     * @chainable
     * @param {String} gestures
     * @param {Function} handler
     */
    off: function offEvent(gestures, handler) {
        var self = this;

        Event.off(self.element, gestures, handler, function(type) {
            var index = Utils.inArray({ gesture: type, handler: handler });
            if(index !== false) {
                self.eventHandlers.splice(index, 1);
            }
        });
        return self;
    },

    /**
     * trigger gesture event
     * @method trigger
     * @chainable
     * @param {String} gesture
     * @param {Object} [eventData]
     */
    trigger: function triggerEvent(gesture, eventData) {
        // optional
        if(!eventData) {
            eventData = {};
        }

        // create DOM event
        var event = Hammer.DOCUMENT.createEvent('Event');
        event.initEvent(gesture, true, true);
        event.gesture = eventData;

        // trigger on the target if it is in the instance element,
        // this is for event delegation tricks
        var element = this.element;
        if(Utils.hasParent(eventData.target, element)) {
            element = eventData.target;
        }

        element.dispatchEvent(event);
        return this;
    },

    /**
     * enable of disable hammer.js detection
     * @method enable
     * @chainable
     * @param {Boolean} state
     */
    enable: function enable(state) {
        this.enabled = state;
        return this;
    },

    /**
     * dispose this hammer instance
     * @method dispose
     * @return {Null}
     */
    dispose: function dispose() {
        var i, eh;

        // undo all changes made by stop_browser_behavior
        Utils.toggleBehavior(this.element, this.options.behavior, false);

        // unbind all custom event handlers
        for(i = -1; (eh = this.eventHandlers[++i]);) {
            Utils.off(this.element, eh.gesture, eh.handler);
        }

        this.eventHandlers = [];

        // unbind the start event listener
        Event.off(this.element, EVENT_TYPES[EVENT_START], this.eventStartHandler);

        return null;
    }
};


/**
 * @module gestures
 */
/**
 * Move with x fingers (default 1) around on the page.
 * Preventing the default browser behavior is a good way to improve feel and working.
 * ````
 *  hammertime.on("drag", function(ev) {
 *    console.log(ev);
 *    ev.gesture.preventDefault();
 *  });
 * ````
 *
 * @class Drag
 * @static
 */
/**
 * @event drag
 * @param {Object} ev
 */
/**
 * @event dragstart
 * @param {Object} ev
 */
/**
 * @event dragend
 * @param {Object} ev
 */
/**
 * @event drapleft
 * @param {Object} ev
 */
/**
 * @event dragright
 * @param {Object} ev
 */
/**
 * @event dragup
 * @param {Object} ev
 */
/**
 * @event dragdown
 * @param {Object} ev
 */

/**
 * @param {String} name
 */
(function(name) {
    var triggered = false;

    function dragGesture(ev, inst) {
        var cur = Detection.current;

        // max touches
        if(inst.options.dragMaxTouches > 0 &&
            ev.touches.length > inst.options.dragMaxTouches) {
            return;
        }

        switch(ev.eventType) {
            case EVENT_START:
                triggered = false;
                break;

            case EVENT_MOVE:
                // when the distance we moved is too small we skip this gesture
                // or we can be already in dragging
                if(ev.distance < inst.options.dragMinDistance &&
                    cur.name != name) {
                    return;
                }

                var startCenter = cur.startEvent.center;

                // we are dragging!
                if(cur.name != name) {
                    cur.name = name;
                    if(inst.options.dragDistanceCorrection && ev.distance > 0) {
                        // When a drag is triggered, set the event center to dragMinDistance pixels from the original event center.
                        // Without this correction, the dragged distance would jumpstart at dragMinDistance pixels instead of at 0.
                        // It might be useful to save the original start point somewhere
                        var factor = Math.abs(inst.options.dragMinDistance / ev.distance);
                        startCenter.pageX += ev.deltaX * factor;
                        startCenter.pageY += ev.deltaY * factor;
                        startCenter.clientX += ev.deltaX * factor;
                        startCenter.clientY += ev.deltaY * factor;

                        // recalculate event data using new start point
                        ev = Detection.extendEventData(ev);
                    }
                }

                // lock drag to axis?
                if(cur.lastEvent.dragLockToAxis ||
                    ( inst.options.dragLockToAxis &&
                        inst.options.dragLockMinDistance <= ev.distance
                        )) {
                    ev.dragLockToAxis = true;
                }

                // keep direction on the axis that the drag gesture started on
                var lastDirection = cur.lastEvent.direction;
                if(ev.dragLockToAxis && lastDirection !== ev.direction) {
                    if(Utils.isVertical(lastDirection)) {
                        ev.direction = (ev.deltaY < 0) ? DIRECTION_UP : DIRECTION_DOWN;
                    } else {
                        ev.direction = (ev.deltaX < 0) ? DIRECTION_LEFT : DIRECTION_RIGHT;
                    }
                }

                // first time, trigger dragstart event
                if(!triggered) {
                    inst.trigger(name + 'start', ev);
                    triggered = true;
                }

                // trigger events
                inst.trigger(name, ev);
                inst.trigger(name + ev.direction, ev);

                var isVertical = Utils.isVertical(ev.direction);

                // block the browser events
                if((inst.options.dragBlockVertical && isVertical) ||
                    (inst.options.dragBlockHorizontal && !isVertical)) {
                    ev.preventDefault();
                }
                break;

            case EVENT_RELEASE:
                if(triggered && ev.changedLength <= inst.options.dragMaxTouches) {
                    inst.trigger(name + 'end', ev);
                    triggered = false;
                }
                break;

            case EVENT_END:
                triggered = false;
                break;
        }
    }

    Hammer.gestures.Drag = {
        name: name,
        index: 50,
        handler: dragGesture,
        defaults: {
            /**
             * minimal movement that have to be made before the drag event gets triggered
             * @property dragMinDistance
             * @type {Number}
             * @default 10
             */
            dragMinDistance: 10,

            /**
             * Set dragDistanceCorrection to true to make the starting point of the drag
             * be calculated from where the drag was triggered, not from where the touch started.
             * Useful to avoid a jerk-starting drag, which can make fine-adjustments
             * through dragging difficult, and be visually unappealing.
             * @property dragDistanceCorrection
             * @type {Boolean}
             * @default true
             */
            dragDistanceCorrection: true,

            /**
             * set 0 for unlimited, but this can conflict with transform
             * @property dragMaxTouches
             * @type {Number}
             * @default 1
             */
            dragMaxTouches: 1,

            /**
             * prevent default browser behavior when dragging occurs
             * be careful with it, it makes the element a blocking element
             * when you are using the drag gesture, it is a good practice to set this true
             * @property dragBlockHorizontal
             * @type {Boolean}
             * @default false
             */
            dragBlockHorizontal: false,

            /**
             * same as `dragBlockHorizontal`, but for vertical movement
             * @property dragBlockVertical
             * @type {Boolean}
             * @default false
             */
            dragBlockVertical: false,

            /**
             * dragLockToAxis keeps the drag gesture on the axis that it started on,
             * It disallows vertical directions if the initial direction was horizontal, and vice versa.
             * @property dragLockToAxis
             * @type {Boolean}
             * @default false
             */
            dragLockToAxis: false,

            /**
             * drag lock only kicks in when distance > dragLockMinDistance
             * This way, locking occurs only when the distance has become large enough to reliably determine the direction
             * @property dragLockMinDistance
             * @type {Number}
             * @default 25
             */
            dragLockMinDistance: 25
        }
    };
})('drag');

/**
 * @module gestures
 */
/**
 * trigger a simple gesture event, so you can do anything in your handler.
 * only usable if you know what your doing...
 *
 * @class Gesture
 * @static
 */
/**
 * @event gesture
 * @param {Object} ev
 */
Hammer.gestures.Gesture = {
    name: 'gesture',
    index: 1337,
    handler: function releaseGesture(ev, inst) {
        inst.trigger(this.name, ev);
    }
};

/**
 * @module gestures
 */
/**
 * Touch stays at the same place for x time
 *
 * @class Hold
 * @static
 */
/**
 * @event hold
 * @param {Object} ev
 */

/**
 * @param {String} name
 */
(function(name) {
    var timer;

    function holdGesture(ev, inst) {
        var options = inst.options,
            current = Detection.current;

        switch(ev.eventType) {
            case EVENT_START:
                clearTimeout(timer);

                // set the gesture so we can check in the timeout if it still is
                current.name = name;

                // set timer and if after the timeout it still is hold,
                // we trigger the hold event
                timer = setTimeout(function() {
                    if(current && current.name == name) {
                        inst.trigger(name, ev);
                    }
                }, options.holdTimeout);
                break;

            case EVENT_MOVE:
                if(ev.distance > options.holdThreshold) {
                    clearTimeout(timer);
                }
                break;

            case EVENT_RELEASE:
                clearTimeout(timer);
                break;
        }
    }

    Hammer.gestures.Hold = {
        name: name,
        index: 10,
        defaults: {
            /**
             * @property holdTimeout
             * @type {Number}
             * @default 500
             */
            holdTimeout: 500,

            /**
             * movement allowed while holding
             * @property holdThreshold
             * @type {Number}
             * @default 2
             */
            holdThreshold: 2
        },
        handler: holdGesture
    };
})('hold');

/**
 * @module gestures
 */
/**
 * when a touch is being released from the page
 *
 * @class Release
 * @static
 */
/**
 * @event release
 * @param {Object} ev
 */
Hammer.gestures.Release = {
    name: 'release',
    index: Infinity,
    handler: function releaseGesture(ev, inst) {
        if(ev.eventType == EVENT_RELEASE) {
            inst.trigger(this.name, ev);
        }
    }
};

/**
 * @module gestures
 */
/**
 * triggers swipe events when the end velocity is above the threshold
 * for best usage, set `preventDefault` (on the drag gesture) to `true`
 * ````
 *  hammertime.on("dragleft swipeleft", function(ev) {
 *    console.log(ev);
 *    ev.gesture.preventDefault();
 *  });
 * ````
 *
 * @class Swipe
 * @static
 */
/**
 * @event swipe
 * @param {Object} ev
 */
/**
 * @event swipeleft
 * @param {Object} ev
 */
/**
 * @event swiperight
 * @param {Object} ev
 */
/**
 * @event swipeup
 * @param {Object} ev
 */
/**
 * @event swipedown
 * @param {Object} ev
 */
Hammer.gestures.Swipe = {
    name: 'swipe',
    index: 40,
    defaults: {
        /**
         * @property swipeMinTouches
         * @type {Number}
         * @default 1
         */
        swipeMinTouches: 1,

        /**
         * @property swipeMaxTouches
         * @type {Number}
         * @default 1
         */
        swipeMaxTouches: 1,

        /**
         * horizontal swipe velocity
         * @property swipeVelocityX
         * @type {Number}
         * @default 0.6
         */
        swipeVelocityX: 0.6,

        /**
         * vertical swipe velocity
         * @property swipeVelocityY
         * @type {Number}
         * @default 0.6
         */
        swipeVelocityY: 0.6
    },

    handler: function swipeGesture(ev, inst) {
        if(ev.eventType == EVENT_RELEASE) {
            var touches = ev.touches.length,
                options = inst.options;

            // max touches
            if(touches < options.swipeMinTouches ||
                touches > options.swipeMaxTouches) {
                return;
            }

            // when the distance we moved is too small we skip this gesture
            // or we can be already in dragging
            if(ev.velocityX > options.swipeVelocityX ||
                ev.velocityY > options.swipeVelocityY) {
                // trigger swipe events
                inst.trigger(this.name, ev);
                inst.trigger(this.name + ev.direction, ev);
            }
        }
    }
};

/**
 * @module gestures
 */
/**
 * Single tap and a double tap on a place
 *
 * @class Tap
 * @static
 */
/**
 * @event tap
 * @param {Object} ev
 */
/**
 * @event doubletap
 * @param {Object} ev
 */

/**
 * @param {String} name
 */
(function(name) {
    var hasMoved = false;

    function tapGesture(ev, inst) {
        var options = inst.options,
            current = Detection.current,
            prev = Detection.previous,
            sincePrev,
            didDoubleTap;

        switch(ev.eventType) {
            case EVENT_START:
                hasMoved = false;
                break;

            case EVENT_MOVE:
                hasMoved = hasMoved || (ev.distance > options.tapMaxDistance);
                break;

            case EVENT_END:
                if(!Utils.inStr(ev.srcEvent.type, 'cancel') && ev.deltaTime < options.tapMaxTime && !hasMoved) {
                    // previous gesture, for the double tap since these are two different gesture detections
                    sincePrev = prev && prev.lastEvent && ev.timeStamp - prev.lastEvent.timeStamp;
                    didDoubleTap = false;

                    // check if double tap
                    if(prev && prev.name == name &&
                        (sincePrev && sincePrev < options.doubleTapInterval) &&
                        ev.distance < options.doubleTapDistance) {
                        inst.trigger('doubletap', ev);
                        didDoubleTap = true;
                    }

                    // do a single tap
                    if(!didDoubleTap || options.tapAlways) {
                        current.name = name;
                        inst.trigger(current.name, ev);
                    }
                }
                break;
        }
    }

    Hammer.gestures.Tap = {
        name: name,
        index: 100,
        handler: tapGesture,
        defaults: {
            /**
             * max time of a tap, this is for the slow tappers
             * @property tapMaxTime
             * @type {Number}
             * @default 250
             */
            tapMaxTime: 250,

            /**
             * max distance of movement of a tap, this is for the slow tappers
             * @property tapMaxDistance
             * @type {Number}
             * @default 10
             */
            tapMaxDistance: 10,

            /**
             * always trigger the `tap` event, even while double-tapping
             * @property tapAlways
             * @type {Boolean}
             * @default true
             */
            tapAlways: true,

            /**
             * max distance between two taps
             * @property doubleTapDistance
             * @type {Number}
             * @default 20
             */
            doubleTapDistance: 20,

            /**
             * max time between two taps
             * @property doubleTapInterval
             * @type {Number}
             * @default 300
             */
            doubleTapInterval: 300
        }
    };
})('tap');

/**
 * @module gestures
 */
/**
 * when a touch is being touched at the page
 *
 * @class Touch
 * @static
 */
/**
 * @event touch
 * @param {Object} ev
 */
Hammer.gestures.Touch = {
    name: 'touch',
    index: -Infinity,
    defaults: {
        /**
         * call preventDefault at touchstart, and makes the element blocking by disabling the scrolling of the page,
         * but it improves gestures like transforming and dragging.
         * be careful with using this, it can be very annoying for users to be stuck on the page
         * @property preventDefault
         * @type {Boolean}
         * @default false
         */
        preventDefault: false,

        /**
         * disable mouse events, so only touch (or pen!) input triggers events
         * @property preventMouse
         * @type {Boolean}
         * @default false
         */
        preventMouse: false
    },
    handler: function touchGesture(ev, inst) {
        if(inst.options.preventMouse && ev.pointerType == POINTER_MOUSE) {
            ev.stopDetect();
            return;
        }

        if(inst.options.preventDefault) {
            ev.preventDefault();
        }

        if(ev.eventType == EVENT_TOUCH) {
            inst.trigger('touch', ev);
        }
    }
};

/**
 * @module gestures
 */
/**
 * User want to scale or rotate with 2 fingers
 * Preventing the default browser behavior is a good way to improve feel and working. This can be done with the
 * `preventDefault` option.
 *
 * @class Transform
 * @static
 */
/**
 * @event transform
 * @param {Object} ev
 */
/**
 * @event transformstart
 * @param {Object} ev
 */
/**
 * @event transformend
 * @param {Object} ev
 */
/**
 * @event pinchin
 * @param {Object} ev
 */
/**
 * @event pinchout
 * @param {Object} ev
 */
/**
 * @event rotate
 * @param {Object} ev
 */

/**
 * @param {String} name
 */
(function(name) {
    var triggered = false;

    function transformGesture(ev, inst) {
        switch(ev.eventType) {
            case EVENT_START:
                triggered = false;
                break;

            case EVENT_MOVE:
                // at least multitouch
                if(ev.touches.length < 2) {
                    return;
                }

                var scaleThreshold = Math.abs(1 - ev.scale);
                var rotationThreshold = Math.abs(ev.rotation);

                // when the distance we moved is too small we skip this gesture
                // or we can be already in dragging
                if(scaleThreshold < inst.options.transformMinScale &&
                    rotationThreshold < inst.options.transformMinRotation) {
                    return;
                }

                // we are transforming!
                Detection.current.name = name;

                // first time, trigger dragstart event
                if(!triggered) {
                    inst.trigger(name + 'start', ev);
                    triggered = true;
                }

                inst.trigger(name, ev); // basic transform event

                // trigger rotate event
                if(rotationThreshold > inst.options.transformMinRotation) {
                    inst.trigger('rotate', ev);
                }

                // trigger pinch event
                if(scaleThreshold > inst.options.transformMinScale) {
                    inst.trigger('pinch', ev);
                    inst.trigger('pinch' + (ev.scale < 1 ? 'in' : 'out'), ev);
                }
                break;

            case EVENT_RELEASE:
                if(triggered && ev.changedLength < 2) {
                    inst.trigger(name + 'end', ev);
                    triggered = false;
                }
                break;
        }
    }

    Hammer.gestures.Transform = {
        name: name,
        index: 45,
        defaults: {
            /**
             * minimal scale factor, no scale is 1, zoomin is to 0 and zoomout until higher then 1
             * @property transformMinScale
             * @type {Number}
             * @default 0.01
             */
            transformMinScale: 0.01,

            /**
             * rotation in degrees
             * @property transformMinRotation
             * @type {Number}
             * @default 1
             */
            transformMinRotation: 1
        },

        handler: transformGesture
    };
})('transform');

/**
 * @module hammer
 */

// AMD export
if(typeof define == 'function' && define.amd) {
    define(function() {
        return Hammer;
    });
// commonjs export
} else if(typeof module !== 'undefined' && module.exports) {
    module.exports = Hammer;
// browser export
} else {
    window.Hammer = Hammer;
}

})(window);
},{}],18:[function(require,module,exports){
require("./tweenmax3/TweenLite.min.js");
require("./tweenmax3/TimelineLite.min.js");
require("./tweenmax3/easing/EasePack.min.js");
require("./tweenmax3/plugins/CSSPlugin.min.js");
require("./tweenmax3/plugins/ScrollToPlugin.min.js");
},{"./tweenmax3/TimelineLite.min.js":19,"./tweenmax3/TweenLite.min.js":20,"./tweenmax3/easing/EasePack.min.js":21,"./tweenmax3/plugins/CSSPlugin.min.js":22,"./tweenmax3/plugins/ScrollToPlugin.min.js":23}],19:[function(require,module,exports){
/*!
 * VERSION: 1.11.0
 * DATE: 2013-10-21
 * UPDATES AND DOCS AT: http://www.greensock.com
 *
 * @license Copyright (c) 2008-2013, GreenSock. All rights reserved.
 * This work is subject to the terms at http://www.greensock.com/terms_of_use.html or for
 * Club GreenSock members, the software agreement that was issued with your membership.
 * 
 * @author: Jack Doyle, jack@greensock.com
 */
(window._gsQueue || (window._gsQueue = [])).push(function () {
    "use strict";
    window._gsDefine("TimelineLite", ["core.Animation", "core.SimpleTimeline", "TweenLite"], function (t, e, i) {
        var s = function (t) {
            e.call(this, t), this._labels = {}, this.autoRemoveChildren = this.vars.autoRemoveChildren === !0, this.smoothChildTiming = this.vars.smoothChildTiming === !0, this._sortChildren = !0, this._onUpdate = this.vars.onUpdate;
            var i, s, r = this.vars;
            for (s in r)i = r[s], a(i) && -1 !== i.join("").indexOf("{self}") && (r[s] = this._swapSelfInParams(i));
            a(r.tweens) && this.add(r.tweens, 0, r.align, r.stagger)
        }, r = 1e-10, n = i._internals.isSelector, a = i._internals.isArray, o = [], h = function (t) {
            var e, i = {};
            for (e in t)i[e] = t[e];
            return i
        }, l = function (t, e, i, s) {
            t._timeline.pause(t._startTime), e && e.apply(s || t._timeline, i || o)
        }, _ = o.slice, u = s.prototype = new e;
        return s.version = "1.11.0", u.constructor = s, u.kill()._gc = !1, u.to = function (t, e, s, r) {
            return e ? this.add(new i(t, e, s), r) : this.set(t, s, r)
        }, u.from = function (t, e, s, r) {
            return this.add(i.from(t, e, s), r)
        }, u.fromTo = function (t, e, s, r, n) {
            return e ? this.add(i.fromTo(t, e, s, r), n) : this.set(t, r, n)
        }, u.staggerTo = function (t, e, r, a, o, l, u, p) {
            var f, c = new s({onComplete: l, onCompleteParams: u, onCompleteScope: p});
            for ("string" == typeof t && (t = i.selector(t) || t), n(t) && (t = _.call(t, 0)), a = a || 0, f = 0; t.length > f; f++)r.startAt && (r.startAt = h(r.startAt)), c.to(t[f], e, h(r), f * a);
            return this.add(c, o)
        }, u.staggerFrom = function (t, e, i, s, r, n, a, o) {
            return i.immediateRender = 0 != i.immediateRender, i.runBackwards = !0, this.staggerTo(t, e, i, s, r, n, a, o)
        }, u.staggerFromTo = function (t, e, i, s, r, n, a, o, h) {
            return s.startAt = i, s.immediateRender = 0 != s.immediateRender && 0 != i.immediateRender, this.staggerTo(t, e, s, r, n, a, o, h)
        }, u.call = function (t, e, s, r) {
            return this.add(i.delayedCall(0, t, e, s), r)
        }, u.set = function (t, e, s) {
            return s = this._parseTimeOrLabel(s, 0, !0), null == e.immediateRender && (e.immediateRender = s === this._time && !this._paused), this.add(new i(t, 0, e), s)
        }, s.exportRoot = function (t, e) {
            t = t || {}, null == t.smoothChildTiming && (t.smoothChildTiming = !0);
            var r, n, a = new s(t), o = a._timeline;
            for (null == e && (e = !0), o._remove(a, !0), a._startTime = 0, a._rawPrevTime = a._time = a._totalTime = o._time, r = o._first; r;)n = r._next, e && r instanceof i && r.target === r.vars.onComplete || a.add(r, r._startTime - r._delay), r = n;
            return o.add(a, 0), a
        }, u.add = function (r, n, o, h) {
            var l, _, u, p, f, c;
            if ("number" != typeof n && (n = this._parseTimeOrLabel(n, 0, !0, r)), !(r instanceof t)) {
                if (r instanceof Array || r && r.push && a(r)) {
                    for (o = o || "normal", h = h || 0, l = n, _ = r.length, u = 0; _ > u; u++)a(p = r[u]) && (p = new s({tweens: p})), this.add(p, l), "string" != typeof p && "function" != typeof p && ("sequence" === o ? l = p._startTime + p.totalDuration() / p._timeScale : "start" === o && (p._startTime -= p.delay())), l += h;
                    return this._uncache(!0)
                }
                if ("string" == typeof r)return this.addLabel(r, n);
                if ("function" != typeof r)throw"Cannot add " + r + " into the timeline; it is not a tween, timeline, function, or string.";
                r = i.delayedCall(0, r)
            }
            if (e.prototype.add.call(this, r, n), this._gc && !this._paused && this._duration < this.duration())for (f = this, c = f.rawTime() > r._startTime; f._gc && f._timeline;)f._timeline.smoothChildTiming && c ? f.totalTime(f._totalTime, !0) : f._enabled(!0, !1), f = f._timeline;
            return this
        }, u.remove = function (e) {
            if (e instanceof t)return this._remove(e, !1);
            if (e instanceof Array || e && e.push && a(e)) {
                for (var i = e.length; --i > -1;)this.remove(e[i]);
                return this
            }
            return"string" == typeof e ? this.removeLabel(e) : this.kill(null, e)
        }, u._remove = function (t, i) {
            e.prototype._remove.call(this, t, i);
            var s = this._last;
            return s ? this._time > s._startTime + s._totalDuration / s._timeScale && (this._time = this.duration(), this._totalTime = this._totalDuration) : this._time = this._totalTime = 0, this
        }, u.append = function (t, e) {
            return this.add(t, this._parseTimeOrLabel(null, e, !0, t))
        }, u.insert = u.insertMultiple = function (t, e, i, s) {
            return this.add(t, e || 0, i, s)
        }, u.appendMultiple = function (t, e, i, s) {
            return this.add(t, this._parseTimeOrLabel(null, e, !0, t), i, s)
        }, u.addLabel = function (t, e) {
            return this._labels[t] = this._parseTimeOrLabel(e), this
        }, u.addPause = function (t, e, i, s) {
            return this.call(l, ["{self}", e, i, s], this, t)
        }, u.removeLabel = function (t) {
            return delete this._labels[t], this
        }, u.getLabelTime = function (t) {
            return null != this._labels[t] ? this._labels[t] : -1
        }, u._parseTimeOrLabel = function (e, i, s, r) {
            var n;
            if (r instanceof t && r.timeline === this)this.remove(r); else if (r && (r instanceof Array || r.push && a(r)))for (n = r.length; --n > -1;)r[n]instanceof t && r[n].timeline === this && this.remove(r[n]);
            if ("string" == typeof i)return this._parseTimeOrLabel(i, s && "number" == typeof e && null == this._labels[i] ? e - this.duration() : 0, s);
            if (i = i || 0, "string" != typeof e || !isNaN(e) && null == this._labels[e])null == e && (e = this.duration()); else {
                if (n = e.indexOf("="), -1 === n)return null == this._labels[e] ? s ? this._labels[e] = this.duration() + i : i : this._labels[e] + i;
                i = parseInt(e.charAt(n - 1) + "1", 10) * Number(e.substr(n + 1)), e = n > 1 ? this._parseTimeOrLabel(e.substr(0, n - 1), 0, s) : this.duration()
            }
            return Number(e) + i
        }, u.seek = function (t, e) {
            return this.totalTime("number" == typeof t ? t : this._parseTimeOrLabel(t), e !== !1)
        }, u.stop = function () {
            return this.paused(!0)
        }, u.gotoAndPlay = function (t, e) {
            return this.play(t, e)
        }, u.gotoAndStop = function (t, e) {
            return this.pause(t, e)
        }, u.render = function (t, e, i) {
            this._gc && this._enabled(!0, !1);
            var s, n, a, h, l, _ = this._dirty ? this.totalDuration() : this._totalDuration, u = this._time, p = this._startTime, f = this._timeScale, c = this._paused;
            if (t >= _ ? (this._totalTime = this._time = _, this._reversed || this._hasPausedChild() || (n = !0, h = "onComplete", 0 === this._duration && (0 === t || 0 > this._rawPrevTime || this._rawPrevTime === r) && this._rawPrevTime !== t && this._first && (l = !0, this._rawPrevTime > r && (h = "onReverseComplete"))), this._rawPrevTime = this._duration || !e || t ? t : r, t = _ + 1e-6) : 1e-7 > t ? (this._totalTime = this._time = 0, (0 !== u || 0 === this._duration && (this._rawPrevTime > r || 0 > t && this._rawPrevTime >= 0)) && (h = "onReverseComplete", n = this._reversed), 0 > t ? (this._active = !1, 0 === this._duration && this._rawPrevTime >= 0 && this._first && (l = !0), this._rawPrevTime = t) : (this._rawPrevTime = this._duration || !e || t ? t : r, t = 0, this._initted || (l = !0))) : this._totalTime = this._time = this._rawPrevTime = t, this._time !== u && this._first || i || l) {
                if (this._initted || (this._initted = !0), this._active || !this._paused && this._time !== u && t > 0 && (this._active = !0), 0 === u && this.vars.onStart && 0 !== this._time && (e || this.vars.onStart.apply(this.vars.onStartScope || this, this.vars.onStartParams || o)), this._time >= u)for (s = this._first; s && (a = s._next, !this._paused || c);)(s._active || s._startTime <= this._time && !s._paused && !s._gc) && (s._reversed ? s.render((s._dirty ? s.totalDuration() : s._totalDuration) - (t - s._startTime) * s._timeScale, e, i) : s.render((t - s._startTime) * s._timeScale, e, i)), s = a; else for (s = this._last; s && (a = s._prev, !this._paused || c);)(s._active || u >= s._startTime && !s._paused && !s._gc) && (s._reversed ? s.render((s._dirty ? s.totalDuration() : s._totalDuration) - (t - s._startTime) * s._timeScale, e, i) : s.render((t - s._startTime) * s._timeScale, e, i)), s = a;
                this._onUpdate && (e || this._onUpdate.apply(this.vars.onUpdateScope || this, this.vars.onUpdateParams || o)), h && (this._gc || (p === this._startTime || f !== this._timeScale) && (0 === this._time || _ >= this.totalDuration()) && (n && (this._timeline.autoRemoveChildren && this._enabled(!1, !1), this._active = !1), !e && this.vars[h] && this.vars[h].apply(this.vars[h + "Scope"] || this, this.vars[h + "Params"] || o)))
            }
        }, u._hasPausedChild = function () {
            for (var t = this._first; t;) {
                if (t._paused || t instanceof s && t._hasPausedChild())return!0;
                t = t._next
            }
            return!1
        }, u.getChildren = function (t, e, s, r) {
            r = r || -9999999999;
            for (var n = [], a = this._first, o = 0; a;)r > a._startTime || (a instanceof i ? e !== !1 && (n[o++] = a) : (s !== !1 && (n[o++] = a), t !== !1 && (n = n.concat(a.getChildren(!0, e, s)), o = n.length))), a = a._next;
            return n
        }, u.getTweensOf = function (t, e) {
            for (var s = i.getTweensOf(t), r = s.length, n = [], a = 0; --r > -1;)(s[r].timeline === this || e && this._contains(s[r])) && (n[a++] = s[r]);
            return n
        }, u._contains = function (t) {
            for (var e = t.timeline; e;) {
                if (e === this)return!0;
                e = e.timeline
            }
            return!1
        }, u.shiftChildren = function (t, e, i) {
            i = i || 0;
            for (var s, r = this._first, n = this._labels; r;)r._startTime >= i && (r._startTime += t), r = r._next;
            if (e)for (s in n)n[s] >= i && (n[s] += t);
            return this._uncache(!0)
        }, u._kill = function (t, e) {
            if (!t && !e)return this._enabled(!1, !1);
            for (var i = e ? this.getTweensOf(e) : this.getChildren(!0, !0, !1), s = i.length, r = !1; --s > -1;)i[s]._kill(t, e) && (r = !0);
            return r
        }, u.clear = function (t) {
            var e = this.getChildren(!1, !0, !0), i = e.length;
            for (this._time = this._totalTime = 0; --i > -1;)e[i]._enabled(!1, !1);
            return t !== !1 && (this._labels = {}), this._uncache(!0)
        }, u.invalidate = function () {
            for (var t = this._first; t;)t.invalidate(), t = t._next;
            return this
        }, u._enabled = function (t, i) {
            if (t === this._gc)for (var s = this._first; s;)s._enabled(t, !0), s = s._next;
            return e.prototype._enabled.call(this, t, i)
        }, u.duration = function (t) {
            return arguments.length ? (0 !== this.duration() && 0 !== t && this.timeScale(this._duration / t), this) : (this._dirty && this.totalDuration(), this._duration)
        }, u.totalDuration = function (t) {
            if (!arguments.length) {
                if (this._dirty) {
                    for (var e, i, s = 0, r = this._last, n = 999999999999; r;)e = r._prev, r._dirty && r.totalDuration(), r._startTime > n && this._sortChildren && !r._paused ? this.add(r, r._startTime - r._delay) : n = r._startTime, 0 > r._startTime && !r._paused && (s -= r._startTime, this._timeline.smoothChildTiming && (this._startTime += r._startTime / this._timeScale), this.shiftChildren(-r._startTime, !1, -9999999999), n = 0), i = r._startTime + r._totalDuration / r._timeScale, i > s && (s = i), r = e;
                    this._duration = this._totalDuration = s, this._dirty = !1
                }
                return this._totalDuration
            }
            return 0 !== this.totalDuration() && 0 !== t && this.timeScale(this._totalDuration / t), this
        }, u.usesFrames = function () {
            for (var e = this._timeline; e._timeline;)e = e._timeline;
            return e === t._rootFramesTimeline
        }, u.rawTime = function () {
            return this._paused ? this._totalTime : (this._timeline.rawTime() - this._startTime) * this._timeScale
        }, s
    }, !0)
}), window._gsDefine && window._gsQueue.pop()();
},{}],20:[function(require,module,exports){
/*!
 * VERSION: 1.11.1
 * DATE: 2013-10-29
 * UPDATES AND DOCS AT: http://www.greensock.com
 *
 * @license Copyright (c) 2008-2013, GreenSock. All rights reserved.
 * This work is subject to the terms at http://www.greensock.com/terms_of_use.html or for
 * Club GreenSock members, the software agreement that was issued with your membership.
 * 
 * @author: Jack Doyle, jack@greensock.com
 */
(function (t) {
    "use strict";
    var e = t.GreenSockGlobals || t;
    if (!e.TweenLite) {
        var i, s, r, n, a, o = function (t) {
            var i, s = t.split("."), r = e;
            for (i = 0; s.length > i; i++)r[s[i]] = r = r[s[i]] || {};
            return r
        }, l = o("com.greensock"), h = 1e-10, _ = [].slice, u = function () {
        }, m = function () {
            var t = Object.prototype.toString, e = t.call([]);
            return function (i) {
                return i instanceof Array || "object" == typeof i && !!i.push && t.call(i) === e
            }
        }(), f = {}, p = function (i, s, r, n) {
            this.sc = f[i] ? f[i].sc : [], f[i] = this, this.gsClass = null, this.func = r;
            var a = [];
            this.check = function (l) {
                for (var h, _, u, m, c = s.length, d = c; --c > -1;)(h = f[s[c]] || new p(s[c], [])).gsClass ? (a[c] = h.gsClass, d--) : l && h.sc.push(this);
                if (0 === d && r)for (_ = ("com.greensock." + i).split("."), u = _.pop(), m = o(_.join("."))[u] = this.gsClass = r.apply(r, a), n && (e[u] = m, "function" == typeof define && define.amd ? define((t.GreenSockAMDPath ? t.GreenSockAMDPath + "/" : "") + i.split(".").join("/"), [], function () {
                    return m
                }) : "undefined" != typeof module && module.exports && (module.exports = m)), c = 0; this.sc.length > c; c++)this.sc[c].check()
            }, this.check(!0)
        }, c = t._gsDefine = function (t, e, i, s) {
            return new p(t, e, i, s)
        }, d = l._class = function (t, e, i) {
            return e = e || function () {
            }, c(t, [], function () {
                return e
            }, i), e
        };
        c.globals = e;
        var v = [0, 0, 1, 1], g = [], T = d("easing.Ease", function (t, e, i, s) {
            this._func = t, this._type = i || 0, this._power = s || 0, this._params = e ? v.concat(e) : v
        }, !0), w = T.map = {}, P = T.register = function (t, e, i, s) {
            for (var r, n, a, o, h = e.split(","), _ = h.length, u = (i || "easeIn,easeOut,easeInOut").split(","); --_ > -1;)for (n = h[_], r = s ? d("easing." + n, null, !0) : l.easing[n] || {}, a = u.length; --a > -1;)o = u[a], w[n + "." + o] = w[o + n] = r[o] = t.getRatio ? t : t[o] || new t
        };
        for (r = T.prototype, r._calcEnd = !1, r.getRatio = function (t) {
            if (this._func)return this._params[0] = t, this._func.apply(null, this._params);
            var e = this._type, i = this._power, s = 1 === e ? 1 - t : 2 === e ? t : .5 > t ? 2 * t : 2 * (1 - t);
            return 1 === i ? s *= s : 2 === i ? s *= s * s : 3 === i ? s *= s * s * s : 4 === i && (s *= s * s * s * s), 1 === e ? 1 - s : 2 === e ? s : .5 > t ? s / 2 : 1 - s / 2
        }, i = ["Linear", "Quad", "Cubic", "Quart", "Quint,Strong"], s = i.length; --s > -1;)r = i[s] + ",Power" + s, P(new T(null, null, 1, s), r, "easeOut", !0), P(new T(null, null, 2, s), r, "easeIn" + (0 === s ? ",easeNone" : "")), P(new T(null, null, 3, s), r, "easeInOut");
        w.linear = l.easing.Linear.easeIn, w.swing = l.easing.Quad.easeInOut;
        var y = d("events.EventDispatcher", function (t) {
            this._listeners = {}, this._eventTarget = t || this
        });
        r = y.prototype, r.addEventListener = function (t, e, i, s, r) {
            r = r || 0;
            var o, l, h = this._listeners[t], _ = 0;
            for (null == h && (this._listeners[t] = h = []), l = h.length; --l > -1;)o = h[l], o.c === e && o.s === i ? h.splice(l, 1) : 0 === _ && r > o.pr && (_ = l + 1);
            h.splice(_, 0, {c: e, s: i, up: s, pr: r}), this !== n || a || n.wake()
        }, r.removeEventListener = function (t, e) {
            var i, s = this._listeners[t];
            if (s)for (i = s.length; --i > -1;)if (s[i].c === e)return s.splice(i, 1), void 0
        }, r.dispatchEvent = function (t) {
            var e, i, s, r = this._listeners[t];
            if (r)for (e = r.length, i = this._eventTarget; --e > -1;)s = r[e], s.up ? s.c.call(s.s || i, {type: t, target: i}) : s.c.call(s.s || i)
        };
        var b = t.requestAnimationFrame, k = t.cancelAnimationFrame, A = Date.now || function () {
            return(new Date).getTime()
        }, S = A();
        for (i = ["ms", "moz", "webkit", "o"], s = i.length; --s > -1 && !b;)b = t[i[s] + "RequestAnimationFrame"], k = t[i[s] + "CancelAnimationFrame"] || t[i[s] + "CancelRequestAnimationFrame"];
        d("Ticker", function (t, e) {
            var i, s, r, o, l, h = this, _ = A(), m = e !== !1 && b, f = function (t) {
                S = A(), h.time = (S - _) / 1e3;
                var e, n = h.time - l;
                (!i || n > 0 || t === !0) && (h.frame++, l += n + (n >= o ? .004 : o - n), e = !0), t !== !0 && (r = s(f)), e && h.dispatchEvent("tick")
            };
            y.call(h), h.time = h.frame = 0, h.tick = function () {
                f(!0)
            }, h.sleep = function () {
                null != r && (m && k ? k(r) : clearTimeout(r), s = u, r = null, h === n && (a = !1))
            }, h.wake = function () {
                null !== r && h.sleep(), s = 0 === i ? u : m && b ? b : function (t) {
                    return setTimeout(t, 0 | 1e3 * (l - h.time) + 1)
                }, h === n && (a = !0), f(2)
            }, h.fps = function (t) {
                return arguments.length ? (i = t, o = 1 / (i || 60), l = this.time + o, h.wake(), void 0) : i
            }, h.useRAF = function (t) {
                return arguments.length ? (h.sleep(), m = t, h.fps(i), void 0) : m
            }, h.fps(t), setTimeout(function () {
                m && (!r || 5 > h.frame) && h.useRAF(!1)
            }, 1500)
        }), r = l.Ticker.prototype = new l.events.EventDispatcher, r.constructor = l.Ticker;
        var x = d("core.Animation", function (t, e) {
            if (this.vars = e = e || {}, this._duration = this._totalDuration = t || 0, this._delay = Number(e.delay) || 0, this._timeScale = 1, this._active = e.immediateRender === !0, this.data = e.data, this._reversed = e.reversed === !0, Q) {
                a || n.wake();
                var i = this.vars.useFrames ? G : Q;
                i.add(this, i._time), this.vars.paused && this.paused(!0)
            }
        });
        n = x.ticker = new l.Ticker, r = x.prototype, r._dirty = r._gc = r._initted = r._paused = !1, r._totalTime = r._time = 0, r._rawPrevTime = -1, r._next = r._last = r._onUpdate = r._timeline = r.timeline = null, r._paused = !1;
        var C = function () {
            A() - S > 2e3 && n.wake(), setTimeout(C, 2e3)
        };
        C(), r.play = function (t, e) {
            return arguments.length && this.seek(t, e), this.reversed(!1).paused(!1)
        }, r.pause = function (t, e) {
            return arguments.length && this.seek(t, e), this.paused(!0)
        }, r.resume = function (t, e) {
            return arguments.length && this.seek(t, e), this.paused(!1)
        }, r.seek = function (t, e) {
            return this.totalTime(Number(t), e !== !1)
        }, r.restart = function (t, e) {
            return this.reversed(!1).paused(!1).totalTime(t ? -this._delay : 0, e !== !1, !0)
        }, r.reverse = function (t, e) {
            return arguments.length && this.seek(t || this.totalDuration(), e), this.reversed(!0).paused(!1)
        }, r.render = function () {
        }, r.invalidate = function () {
            return this
        }, r.isActive = function () {
            var t, e = this._timeline, i = this._startTime;
            return!e || !this._gc && !this._paused && e.isActive() && (t = e.rawTime()) >= i && i + this.totalDuration() / this._timeScale > t
        }, r._enabled = function (t, e) {
            return a || n.wake(), this._gc = !t, this._active = this.isActive(), e !== !0 && (t && !this.timeline ? this._timeline.add(this, this._startTime - this._delay) : !t && this.timeline && this._timeline._remove(this, !0)), !1
        }, r._kill = function () {
            return this._enabled(!1, !1)
        }, r.kill = function (t, e) {
            return this._kill(t, e), this
        }, r._uncache = function (t) {
            for (var e = t ? this : this.timeline; e;)e._dirty = !0, e = e.timeline;
            return this
        }, r._swapSelfInParams = function (t) {
            for (var e = t.length, i = t.concat(); --e > -1;)"{self}" === t[e] && (i[e] = this);
            return i
        }, r.eventCallback = function (t, e, i, s) {
            if ("on" === (t || "").substr(0, 2)) {
                var r = this.vars;
                if (1 === arguments.length)return r[t];
                null == e ? delete r[t] : (r[t] = e, r[t + "Params"] = m(i) && -1 !== i.join("").indexOf("{self}") ? this._swapSelfInParams(i) : i, r[t + "Scope"] = s), "onUpdate" === t && (this._onUpdate = e)
            }
            return this
        }, r.delay = function (t) {
            return arguments.length ? (this._timeline.smoothChildTiming && this.startTime(this._startTime + t - this._delay), this._delay = t, this) : this._delay
        }, r.duration = function (t) {
            return arguments.length ? (this._duration = this._totalDuration = t, this._uncache(!0), this._timeline.smoothChildTiming && this._time > 0 && this._time < this._duration && 0 !== t && this.totalTime(this._totalTime * (t / this._duration), !0), this) : (this._dirty = !1, this._duration)
        }, r.totalDuration = function (t) {
            return this._dirty = !1, arguments.length ? this.duration(t) : this._totalDuration
        }, r.time = function (t, e) {
            return arguments.length ? (this._dirty && this.totalDuration(), this.totalTime(t > this._duration ? this._duration : t, e)) : this._time
        }, r.totalTime = function (t, e, i) {
            if (a || n.wake(), !arguments.length)return this._totalTime;
            if (this._timeline) {
                if (0 > t && !i && (t += this.totalDuration()), this._timeline.smoothChildTiming) {
                    this._dirty && this.totalDuration();
                    var s = this._totalDuration, r = this._timeline;
                    if (t > s && !i && (t = s), this._startTime = (this._paused ? this._pauseTime : r._time) - (this._reversed ? s - t : t) / this._timeScale, r._dirty || this._uncache(!1), r._timeline)for (; r._timeline;)r._timeline._time !== (r._startTime + r._totalTime) / r._timeScale && r.totalTime(r._totalTime, !0), r = r._timeline
                }
                this._gc && this._enabled(!0, !1), (this._totalTime !== t || 0 === this._duration) && this.render(t, e, !1)
            }
            return this
        }, r.progress = r.totalProgress = function (t, e) {
            return arguments.length ? this.totalTime(this.duration() * t, e) : this._time / this.duration()
        }, r.startTime = function (t) {
            return arguments.length ? (t !== this._startTime && (this._startTime = t, this.timeline && this.timeline._sortChildren && this.timeline.add(this, t - this._delay)), this) : this._startTime
        }, r.timeScale = function (t) {
            if (!arguments.length)return this._timeScale;
            if (t = t || h, this._timeline && this._timeline.smoothChildTiming) {
                var e = this._pauseTime, i = e || 0 === e ? e : this._timeline.totalTime();
                this._startTime = i - (i - this._startTime) * this._timeScale / t
            }
            return this._timeScale = t, this._uncache(!1)
        }, r.reversed = function (t) {
            return arguments.length ? (t != this._reversed && (this._reversed = t, this.totalTime(this._totalTime, !0)), this) : this._reversed
        }, r.paused = function (t) {
            if (!arguments.length)return this._paused;
            if (t != this._paused && this._timeline) {
                a || t || n.wake();
                var e = this._timeline, i = e.rawTime(), s = i - this._pauseTime;
                !t && e.smoothChildTiming && (this._startTime += s, this._uncache(!1)), this._pauseTime = t ? i : null, this._paused = t, this._active = this.isActive(), !t && 0 !== s && this._initted && this.duration() && this.render(e.smoothChildTiming ? this._totalTime : (i - this._startTime) / this._timeScale, !0, !0)
            }
            return this._gc && !t && this._enabled(!0, !1), this
        };
        var R = d("core.SimpleTimeline", function (t) {
            x.call(this, 0, t), this.autoRemoveChildren = this.smoothChildTiming = !0
        });
        r = R.prototype = new x, r.constructor = R, r.kill()._gc = !1, r._first = r._last = null, r._sortChildren = !1, r.add = r.insert = function (t, e) {
            var i, s;
            if (t._startTime = Number(e || 0) + t._delay, t._paused && this !== t._timeline && (t._pauseTime = t._startTime + (this.rawTime() - t._startTime) / t._timeScale), t.timeline && t.timeline._remove(t, !0), t.timeline = t._timeline = this, t._gc && t._enabled(!0, !0), i = this._last, this._sortChildren)for (s = t._startTime; i && i._startTime > s;)i = i._prev;
            return i ? (t._next = i._next, i._next = t) : (t._next = this._first, this._first = t), t._next ? t._next._prev = t : this._last = t, t._prev = i, this._timeline && this._uncache(!0), this
        }, r._remove = function (t, e) {
            return t.timeline === this && (e || t._enabled(!1, !0), t.timeline = null, t._prev ? t._prev._next = t._next : this._first === t && (this._first = t._next), t._next ? t._next._prev = t._prev : this._last === t && (this._last = t._prev), this._timeline && this._uncache(!0)), this
        }, r.render = function (t, e, i) {
            var s, r = this._first;
            for (this._totalTime = this._time = this._rawPrevTime = t; r;)s = r._next, (r._active || t >= r._startTime && !r._paused) && (r._reversed ? r.render((r._dirty ? r.totalDuration() : r._totalDuration) - (t - r._startTime) * r._timeScale, e, i) : r.render((t - r._startTime) * r._timeScale, e, i)), r = s
        }, r.rawTime = function () {
            return a || n.wake(), this._totalTime
        };
        var D = d("TweenLite", function (e, i, s) {
            if (x.call(this, i, s), this.render = D.prototype.render, null == e)throw"Cannot tween a null target.";
            this.target = e = "string" != typeof e ? e : D.selector(e) || e;
            var r, n, a, o = e.jquery || e.length && e !== t && e[0] && (e[0] === t || e[0].nodeType && e[0].style && !e.nodeType), l = this.vars.overwrite;
            if (this._overwrite = l = null == l ? j[D.defaultOverwrite] : "number" == typeof l ? l >> 0 : j[l], (o || e instanceof Array || e.push && m(e)) && "number" != typeof e[0])for (this._targets = a = _.call(e, 0), this._propLookup = [], this._siblings = [], r = 0; a.length > r; r++)n = a[r], n ? "string" != typeof n ? n.length && n !== t && n[0] && (n[0] === t || n[0].nodeType && n[0].style && !n.nodeType) ? (a.splice(r--, 1), this._targets = a = a.concat(_.call(n, 0))) : (this._siblings[r] = B(n, this, !1), 1 === l && this._siblings[r].length > 1 && q(n, this, null, 1, this._siblings[r])) : (n = a[r--] = D.selector(n), "string" == typeof n && a.splice(r + 1, 1)) : a.splice(r--, 1); else this._propLookup = {}, this._siblings = B(e, this, !1), 1 === l && this._siblings.length > 1 && q(e, this, null, 1, this._siblings);
            (this.vars.immediateRender || 0 === i && 0 === this._delay && this.vars.immediateRender !== !1) && this.render(-this._delay, !1, !0)
        }, !0), E = function (e) {
            return e.length && e !== t && e[0] && (e[0] === t || e[0].nodeType && e[0].style && !e.nodeType)
        }, I = function (t, e) {
            var i, s = {};
            for (i in t)F[i] || i in e && "x" !== i && "y" !== i && "width" !== i && "height" !== i && "className" !== i && "border" !== i || !(!N[i] || N[i] && N[i]._autoCSS) || (s[i] = t[i], delete t[i]);
            t.css = s
        };
        r = D.prototype = new x, r.constructor = D, r.kill()._gc = !1, r.ratio = 0, r._firstPT = r._targets = r._overwrittenProps = r._startAt = null, r._notifyPluginsOfEnabled = !1, D.version = "1.11.1", D.defaultEase = r._ease = new T(null, null, 1, 1), D.defaultOverwrite = "auto", D.ticker = n, D.autoSleep = !0, D.selector = t.$ || t.jQuery || function (e) {
            return t.$ ? (D.selector = t.$, t.$(e)) : t.document ? t.document.getElementById("#" === e.charAt(0) ? e.substr(1) : e) : e
        };
        var O = D._internals = {isArray: m, isSelector: E}, N = D._plugins = {}, L = D._tweenLookup = {}, U = 0, F = O.reservedProps = {ease: 1, delay: 1, overwrite: 1, onComplete: 1, onCompleteParams: 1, onCompleteScope: 1, useFrames: 1, runBackwards: 1, startAt: 1, onUpdate: 1, onUpdateParams: 1, onUpdateScope: 1, onStart: 1, onStartParams: 1, onStartScope: 1, onReverseComplete: 1, onReverseCompleteParams: 1, onReverseCompleteScope: 1, onRepeat: 1, onRepeatParams: 1, onRepeatScope: 1, easeParams: 1, yoyo: 1, immediateRender: 1, repeat: 1, repeatDelay: 1, data: 1, paused: 1, reversed: 1, autoCSS: 1}, j = {none: 0, all: 1, auto: 2, concurrent: 3, allOnStart: 4, preexisting: 5, "true": 1, "false": 0}, G = x._rootFramesTimeline = new R, Q = x._rootTimeline = new R;
        Q._startTime = n.time, G._startTime = n.frame, Q._active = G._active = !0, x._updateRoot = function () {
            if (Q.render((n.time - Q._startTime) * Q._timeScale, !1, !1), G.render((n.frame - G._startTime) * G._timeScale, !1, !1), !(n.frame % 120)) {
                var t, e, i;
                for (i in L) {
                    for (e = L[i].tweens, t = e.length; --t > -1;)e[t]._gc && e.splice(t, 1);
                    0 === e.length && delete L[i]
                }
                if (i = Q._first, (!i || i._paused) && D.autoSleep && !G._first && 1 === n._listeners.tick.length) {
                    for (; i && i._paused;)i = i._next;
                    i || n.sleep()
                }
            }
        }, n.addEventListener("tick", x._updateRoot);
        var B = function (t, e, i) {
            var s, r, n = t._gsTweenID;
            if (L[n || (t._gsTweenID = n = "t" + U++)] || (L[n] = {target: t, tweens: []}), e && (s = L[n].tweens, s[r = s.length] = e, i))for (; --r > -1;)s[r] === e && s.splice(r, 1);
            return L[n].tweens
        }, q = function (t, e, i, s, r) {
            var n, a, o, l;
            if (1 === s || s >= 4) {
                for (l = r.length, n = 0; l > n; n++)if ((o = r[n]) !== e)o._gc || o._enabled(!1, !1) && (a = !0); else if (5 === s)break;
                return a
            }
            var _, u = e._startTime + h, m = [], f = 0, p = 0 === e._duration;
            for (n = r.length; --n > -1;)(o = r[n]) === e || o._gc || o._paused || (o._timeline !== e._timeline ? (_ = _ || $(e, 0, p), 0 === $(o, _, p) && (m[f++] = o)) : u >= o._startTime && o._startTime + o.totalDuration() / o._timeScale + h > u && ((p || !o._initted) && 2e-10 >= u - o._startTime || (m[f++] = o)));
            for (n = f; --n > -1;)o = m[n], 2 === s && o._kill(i, t) && (a = !0), (2 !== s || !o._firstPT && o._initted) && o._enabled(!1, !1) && (a = !0);
            return a
        }, $ = function (t, e, i) {
            for (var s = t._timeline, r = s._timeScale, n = t._startTime; s._timeline;) {
                if (n += s._startTime, r *= s._timeScale, s._paused)return-100;
                s = s._timeline
            }
            return n /= r, n > e ? n - e : i && n === e || !t._initted && 2 * h > n - e ? h : (n += t.totalDuration() / t._timeScale / r) > e + h ? 0 : n - e - h
        };
        r._init = function () {
            var t, e, i, s, r = this.vars, n = this._overwrittenProps, a = this._duration, o = r.immediateRender, l = r.ease;
            if (r.startAt) {
                if (this._startAt && this._startAt.render(-1, !0), r.startAt.overwrite = 0, r.startAt.immediateRender = !0, this._startAt = D.to(this.target, 0, r.startAt), o)if (this._time > 0)this._startAt = null; else if (0 !== a)return
            } else if (r.runBackwards && 0 !== a)if (this._startAt)this._startAt.render(-1, !0), this._startAt = null; else {
                i = {};
                for (s in r)F[s] && "autoCSS" !== s || (i[s] = r[s]);
                if (i.overwrite = 0, i.data = "isFromStart", this._startAt = D.to(this.target, 0, i), r.immediateRender) {
                    if (0 === this._time)return
                } else this._startAt.render(-1, !0)
            }
            if (this._ease = l ? l instanceof T ? r.easeParams instanceof Array ? l.config.apply(l, r.easeParams) : l : "function" == typeof l ? new T(l, r.easeParams) : w[l] || D.defaultEase : D.defaultEase, this._easeType = this._ease._type, this._easePower = this._ease._power, this._firstPT = null, this._targets)for (t = this._targets.length; --t > -1;)this._initProps(this._targets[t], this._propLookup[t] = {}, this._siblings[t], n ? n[t] : null) && (e = !0); else e = this._initProps(this.target, this._propLookup, this._siblings, n);
            if (e && D._onPluginEvent("_onInitAllProps", this), n && (this._firstPT || "function" != typeof this.target && this._enabled(!1, !1)), r.runBackwards)for (i = this._firstPT; i;)i.s += i.c, i.c = -i.c, i = i._next;
            this._onUpdate = r.onUpdate, this._initted = !0
        }, r._initProps = function (e, i, s, r) {
            var n, a, o, l, h, _;
            if (null == e)return!1;
            this.vars.css || e.style && e !== t && e.nodeType && N.css && this.vars.autoCSS !== !1 && I(this.vars, e);
            for (n in this.vars) {
                if (_ = this.vars[n], F[n])_ && (_ instanceof Array || _.push && m(_)) && -1 !== _.join("").indexOf("{self}") && (this.vars[n] = _ = this._swapSelfInParams(_, this)); else if (N[n] && (l = new N[n])._onInitTween(e, this.vars[n], this)) {
                    for (this._firstPT = h = {_next: this._firstPT, t: l, p: "setRatio", s: 0, c: 1, f: !0, n: n, pg: !0, pr: l._priority}, a = l._overwriteProps.length; --a > -1;)i[l._overwriteProps[a]] = this._firstPT;
                    (l._priority || l._onInitAllProps) && (o = !0), (l._onDisable || l._onEnable) && (this._notifyPluginsOfEnabled = !0)
                } else this._firstPT = i[n] = h = {_next: this._firstPT, t: e, p: n, f: "function" == typeof e[n], n: n, pg: !1, pr: 0}, h.s = h.f ? e[n.indexOf("set") || "function" != typeof e["get" + n.substr(3)] ? n : "get" + n.substr(3)]() : parseFloat(e[n]), h.c = "string" == typeof _ && "=" === _.charAt(1) ? parseInt(_.charAt(0) + "1", 10) * Number(_.substr(2)) : Number(_) - h.s || 0;
                h && h._next && (h._next._prev = h)
            }
            return r && this._kill(r, e) ? this._initProps(e, i, s, r) : this._overwrite > 1 && this._firstPT && s.length > 1 && q(e, this, i, this._overwrite, s) ? (this._kill(i, e), this._initProps(e, i, s, r)) : o
        }, r.render = function (t, e, i) {
            var s, r, n, a, o = this._time, l = this._duration;
            if (t >= l)this._totalTime = this._time = l, this.ratio = this._ease._calcEnd ? this._ease.getRatio(1) : 1, this._reversed || (s = !0, r = "onComplete"), 0 === l && (a = this._rawPrevTime, (0 === t || 0 > a || a === h) && a !== t && (i = !0, a > h && (r = "onReverseComplete")), this._rawPrevTime = a = !e || t ? t : h); else if (1e-7 > t)this._totalTime = this._time = 0, this.ratio = this._ease._calcEnd ? this._ease.getRatio(0) : 0, (0 !== o || 0 === l && this._rawPrevTime > h) && (r = "onReverseComplete", s = this._reversed), 0 > t ? (this._active = !1, 0 === l && (this._rawPrevTime >= 0 && (i = !0), this._rawPrevTime = a = !e || t ? t : h)) : this._initted || (i = !0); else if (this._totalTime = this._time = t, this._easeType) {
                var _ = t / l, u = this._easeType, m = this._easePower;
                (1 === u || 3 === u && _ >= .5) && (_ = 1 - _), 3 === u && (_ *= 2), 1 === m ? _ *= _ : 2 === m ? _ *= _ * _ : 3 === m ? _ *= _ * _ * _ : 4 === m && (_ *= _ * _ * _ * _), this.ratio = 1 === u ? 1 - _ : 2 === u ? _ : .5 > t / l ? _ / 2 : 1 - _ / 2
            } else this.ratio = this._ease.getRatio(t / l);
            if (this._time !== o || i) {
                if (!this._initted) {
                    if (this._init(), !this._initted || this._gc)return;
                    this._time && !s ? this.ratio = this._ease.getRatio(this._time / l) : s && this._ease._calcEnd && (this.ratio = this._ease.getRatio(0 === this._time ? 0 : 1))
                }
                for (this._active || !this._paused && this._time !== o && t >= 0 && (this._active = !0), 0 === o && (this._startAt && (t >= 0 ? this._startAt.render(t, e, i) : r || (r = "_dummyGS")), this.vars.onStart && (0 !== this._time || 0 === l) && (e || this.vars.onStart.apply(this.vars.onStartScope || this, this.vars.onStartParams || g))), n = this._firstPT; n;)n.f ? n.t[n.p](n.c * this.ratio + n.s) : n.t[n.p] = n.c * this.ratio + n.s, n = n._next;
                this._onUpdate && (0 > t && this._startAt && this._startTime && this._startAt.render(t, e, i), e || i && 0 === this._time && 0 === o || this._onUpdate.apply(this.vars.onUpdateScope || this, this.vars.onUpdateParams || g)), r && (this._gc || (0 > t && this._startAt && !this._onUpdate && this._startTime && this._startAt.render(t, e, i), s && (this._timeline.autoRemoveChildren && this._enabled(!1, !1), this._active = !1), !e && this.vars[r] && this.vars[r].apply(this.vars[r + "Scope"] || this, this.vars[r + "Params"] || g), 0 === l && this._rawPrevTime === h && a !== h && (this._rawPrevTime = 0)))
            }
        }, r._kill = function (t, e) {
            if ("all" === t && (t = null), null == t && (null == e || e === this.target))return this._enabled(!1, !1);
            e = "string" != typeof e ? e || this._targets || this.target : D.selector(e) || e;
            var i, s, r, n, a, o, l, h;
            if ((m(e) || E(e)) && "number" != typeof e[0])for (i = e.length; --i > -1;)this._kill(t, e[i]) && (o = !0); else {
                if (this._targets) {
                    for (i = this._targets.length; --i > -1;)if (e === this._targets[i]) {
                        a = this._propLookup[i] || {}, this._overwrittenProps = this._overwrittenProps || [], s = this._overwrittenProps[i] = t ? this._overwrittenProps[i] || {} : "all";
                        break
                    }
                } else {
                    if (e !== this.target)return!1;
                    a = this._propLookup, s = this._overwrittenProps = t ? this._overwrittenProps || {} : "all"
                }
                if (a) {
                    l = t || a, h = t !== s && "all" !== s && t !== a && ("object" != typeof t || !t._tempKill);
                    for (r in l)(n = a[r]) && (n.pg && n.t._kill(l) && (o = !0), n.pg && 0 !== n.t._overwriteProps.length || (n._prev ? n._prev._next = n._next : n === this._firstPT && (this._firstPT = n._next), n._next && (n._next._prev = n._prev), n._next = n._prev = null), delete a[r]), h && (s[r] = 1);
                    !this._firstPT && this._initted && this._enabled(!1, !1)
                }
            }
            return o
        }, r.invalidate = function () {
            return this._notifyPluginsOfEnabled && D._onPluginEvent("_onDisable", this), this._firstPT = null, this._overwrittenProps = null, this._onUpdate = null, this._startAt = null, this._initted = this._active = this._notifyPluginsOfEnabled = !1, this._propLookup = this._targets ? {} : [], this
        }, r._enabled = function (t, e) {
            if (a || n.wake(), t && this._gc) {
                var i, s = this._targets;
                if (s)for (i = s.length; --i > -1;)this._siblings[i] = B(s[i], this, !0); else this._siblings = B(this.target, this, !0)
            }
            return x.prototype._enabled.call(this, t, e), this._notifyPluginsOfEnabled && this._firstPT ? D._onPluginEvent(t ? "_onEnable" : "_onDisable", this) : !1
        }, D.to = function (t, e, i) {
            return new D(t, e, i)
        }, D.from = function (t, e, i) {
            return i.runBackwards = !0, i.immediateRender = 0 != i.immediateRender, new D(t, e, i)
        }, D.fromTo = function (t, e, i, s) {
            return s.startAt = i, s.immediateRender = 0 != s.immediateRender && 0 != i.immediateRender, new D(t, e, s)
        }, D.delayedCall = function (t, e, i, s, r) {
            return new D(e, 0, {delay: t, onComplete: e, onCompleteParams: i, onCompleteScope: s, onReverseComplete: e, onReverseCompleteParams: i, onReverseCompleteScope: s, immediateRender: !1, useFrames: r, overwrite: 0})
        }, D.set = function (t, e) {
            return new D(t, 0, e)
        }, D.getTweensOf = function (t, e) {
            if (null == t)return[];
            t = "string" != typeof t ? t : D.selector(t) || t;
            var i, s, r, n;
            if ((m(t) || E(t)) && "number" != typeof t[0]) {
                for (i = t.length, s = []; --i > -1;)s = s.concat(D.getTweensOf(t[i], e));
                for (i = s.length; --i > -1;)for (n = s[i], r = i; --r > -1;)n === s[r] && s.splice(i, 1)
            } else for (s = B(t).concat(), i = s.length; --i > -1;)(s[i]._gc || e && !s[i].isActive()) && s.splice(i, 1);
            return s
        }, D.killTweensOf = D.killDelayedCallsTo = function (t, e, i) {
            "object" == typeof e && (i = e, e = !1);
            for (var s = D.getTweensOf(t, e), r = s.length; --r > -1;)s[r]._kill(i, t)
        };
        var M = d("plugins.TweenPlugin", function (t, e) {
            this._overwriteProps = (t || "").split(","), this._propName = this._overwriteProps[0], this._priority = e || 0, this._super = M.prototype
        }, !0);
        if (r = M.prototype, M.version = "1.10.1", M.API = 2, r._firstPT = null, r._addTween = function (t, e, i, s, r, n) {
            var a, o;
            return null != s && (a = "number" == typeof s || "=" !== s.charAt(1) ? Number(s) - i : parseInt(s.charAt(0) + "1", 10) * Number(s.substr(2))) ? (this._firstPT = o = {_next: this._firstPT, t: t, p: e, s: i, c: a, f: "function" == typeof t[e], n: r || e, r: n}, o._next && (o._next._prev = o), o) : void 0
        }, r.setRatio = function (t) {
            for (var e, i = this._firstPT, s = 1e-6; i;)e = i.c * t + i.s, i.r ? e = 0 | e + (e > 0 ? .5 : -.5) : s > e && e > -s && (e = 0), i.f ? i.t[i.p](e) : i.t[i.p] = e, i = i._next
        }, r._kill = function (t) {
            var e, i = this._overwriteProps, s = this._firstPT;
            if (null != t[this._propName])this._overwriteProps = []; else for (e = i.length; --e > -1;)null != t[i[e]] && i.splice(e, 1);
            for (; s;)null != t[s.n] && (s._next && (s._next._prev = s._prev), s._prev ? (s._prev._next = s._next, s._prev = null) : this._firstPT === s && (this._firstPT = s._next)), s = s._next;
            return!1
        }, r._roundProps = function (t, e) {
            for (var i = this._firstPT; i;)(t[this._propName] || null != i.n && t[i.n.split(this._propName + "_").join("")]) && (i.r = e), i = i._next
        }, D._onPluginEvent = function (t, e) {
            var i, s, r, n, a, o = e._firstPT;
            if ("_onInitAllProps" === t) {
                for (; o;) {
                    for (a = o._next, s = r; s && s.pr > o.pr;)s = s._next;
                    (o._prev = s ? s._prev : n) ? o._prev._next = o : r = o, (o._next = s) ? s._prev = o : n = o, o = a
                }
                o = e._firstPT = r
            }
            for (; o;)o.pg && "function" == typeof o.t[t] && o.t[t]() && (i = !0), o = o._next;
            return i
        }, M.activate = function (t) {
            for (var e = t.length; --e > -1;)t[e].API === M.API && (N[(new t[e])._propName] = t[e]);
            return!0
        }, c.plugin = function (t) {
            if (!(t && t.propName && t.init && t.API))throw"illegal plugin definition.";
            var e, i = t.propName, s = t.priority || 0, r = t.overwriteProps, n = {init: "_onInitTween", set: "setRatio", kill: "_kill", round: "_roundProps", initAll: "_onInitAllProps"}, a = d("plugins." + i.charAt(0).toUpperCase() + i.substr(1) + "Plugin", function () {
                M.call(this, i, s), this._overwriteProps = r || []
            }, t.global === !0), o = a.prototype = new M(i);
            o.constructor = a, a.API = t.API;
            for (e in n)"function" == typeof t[e] && (o[n[e]] = t[e]);
            return a.version = t.version, M.activate([a]), a
        }, i = t._gsQueue) {
            for (s = 0; i.length > s; s++)i[s]();
            for (r in f)f[r].func || t.console.log("GSAP encountered missing dependency: com.greensock." + r)
        }
        a = !1
    }
})(window);
},{}],21:[function(require,module,exports){
/*!
 * VERSION: beta 1.9.3
 * DATE: 2013-04-02
 * UPDATES AND DOCS AT: http://www.greensock.com
 *
 * @license Copyright (c) 2008-2013, GreenSock. All rights reserved.
 * This work is subject to the terms at http://www.greensock.com/terms_of_use.html or for
 * Club GreenSock members, the software agreement that was issued with your membership.
 * 
 * @author: Jack Doyle, jack@greensock.com
 **/
(window._gsQueue || (window._gsQueue = [])).push(function () {
    "use strict";
    window._gsDefine("easing.Back", ["easing.Ease"], function (t) {
        var e, i, s, r = window.GreenSockGlobals || window, n = r.com.greensock, a = 2 * Math.PI, o = Math.PI / 2, h = n._class, l = function (e, i) {
            var s = h("easing." + e, function () {
            }, !0), r = s.prototype = new t;
            return r.constructor = s, r.getRatio = i, s
        }, _ = t.register || function () {
        }, u = function (t, e, i, s) {
            var r = h("easing." + t, {easeOut: new e, easeIn: new i, easeInOut: new s}, !0);
            return _(r, t), r
        }, c = function (t, e, i) {
            this.t = t, this.v = e, i && (this.next = i, i.prev = this, this.c = i.v - e, this.gap = i.t - t)
        }, p = function (e, i) {
            var s = h("easing." + e, function (t) {
                this._p1 = t || 0 === t ? t : 1.70158, this._p2 = 1.525 * this._p1
            }, !0), r = s.prototype = new t;
            return r.constructor = s, r.getRatio = i, r.config = function (t) {
                return new s(t)
            }, s
        }, f = u("Back", p("BackOut", function (t) {
            return(t -= 1) * t * ((this._p1 + 1) * t + this._p1) + 1
        }), p("BackIn", function (t) {
            return t * t * ((this._p1 + 1) * t - this._p1)
        }), p("BackInOut", function (t) {
            return 1 > (t *= 2) ? .5 * t * t * ((this._p2 + 1) * t - this._p2) : .5 * ((t -= 2) * t * ((this._p2 + 1) * t + this._p2) + 2)
        })), m = h("easing.SlowMo", function (t, e, i) {
            e = e || 0 === e ? e : .7, null == t ? t = .7 : t > 1 && (t = 1), this._p = 1 !== t ? e : 0, this._p1 = (1 - t) / 2, this._p2 = t, this._p3 = this._p1 + this._p2, this._calcEnd = i === !0
        }, !0), d = m.prototype = new t;
        return d.constructor = m, d.getRatio = function (t) {
            var e = t + (.5 - t) * this._p;
            return this._p1 > t ? this._calcEnd ? 1 - (t = 1 - t / this._p1) * t : e - (t = 1 - t / this._p1) * t * t * t * e : t > this._p3 ? this._calcEnd ? 1 - (t = (t - this._p3) / this._p1) * t : e + (t - e) * (t = (t - this._p3) / this._p1) * t * t * t : this._calcEnd ? 1 : e
        }, m.ease = new m(.7, .7), d.config = m.config = function (t, e, i) {
            return new m(t, e, i)
        }, e = h("easing.SteppedEase", function (t) {
            t = t || 1, this._p1 = 1 / t, this._p2 = t + 1
        }, !0), d = e.prototype = new t, d.constructor = e, d.getRatio = function (t) {
            return 0 > t ? t = 0 : t >= 1 && (t = .999999999), (this._p2 * t >> 0) * this._p1
        }, d.config = e.config = function (t) {
            return new e(t)
        }, i = h("easing.RoughEase", function (e) {
            e = e || {};
            for (var i, s, r, n, a, o, h = e.taper || "none", l = [], _ = 0, u = 0 | (e.points || 20), p = u, f = e.randomize !== !1, m = e.clamp === !0, d = e.template instanceof t ? e.template : null, g = "number" == typeof e.strength ? .4 * e.strength : .4; --p > -1;)i = f ? Math.random() : 1 / u * p, s = d ? d.getRatio(i) : i, "none" === h ? r = g : "out" === h ? (n = 1 - i, r = n * n * g) : "in" === h ? r = i * i * g : .5 > i ? (n = 2 * i, r = .5 * n * n * g) : (n = 2 * (1 - i), r = .5 * n * n * g), f ? s += Math.random() * r - .5 * r : p % 2 ? s += .5 * r : s -= .5 * r, m && (s > 1 ? s = 1 : 0 > s && (s = 0)), l[_++] = {x: i, y: s};
            for (l.sort(function (t, e) {
                return t.x - e.x
            }), o = new c(1, 1, null), p = u; --p > -1;)a = l[p], o = new c(a.x, a.y, o);
            this._prev = new c(0, 0, 0 !== o.t ? o : o.next)
        }, !0), d = i.prototype = new t, d.constructor = i, d.getRatio = function (t) {
            var e = this._prev;
            if (t > e.t) {
                for (; e.next && t >= e.t;)e = e.next;
                e = e.prev
            } else for (; e.prev && e.t >= t;)e = e.prev;
            return this._prev = e, e.v + (t - e.t) / e.gap * e.c
        }, d.config = function (t) {
            return new i(t)
        }, i.ease = new i, u("Bounce", l("BounceOut", function (t) {
            return 1 / 2.75 > t ? 7.5625 * t * t : 2 / 2.75 > t ? 7.5625 * (t -= 1.5 / 2.75) * t + .75 : 2.5 / 2.75 > t ? 7.5625 * (t -= 2.25 / 2.75) * t + .9375 : 7.5625 * (t -= 2.625 / 2.75) * t + .984375
        }), l("BounceIn", function (t) {
            return 1 / 2.75 > (t = 1 - t) ? 1 - 7.5625 * t * t : 2 / 2.75 > t ? 1 - (7.5625 * (t -= 1.5 / 2.75) * t + .75) : 2.5 / 2.75 > t ? 1 - (7.5625 * (t -= 2.25 / 2.75) * t + .9375) : 1 - (7.5625 * (t -= 2.625 / 2.75) * t + .984375)
        }), l("BounceInOut", function (t) {
            var e = .5 > t;
            return t = e ? 1 - 2 * t : 2 * t - 1, t = 1 / 2.75 > t ? 7.5625 * t * t : 2 / 2.75 > t ? 7.5625 * (t -= 1.5 / 2.75) * t + .75 : 2.5 / 2.75 > t ? 7.5625 * (t -= 2.25 / 2.75) * t + .9375 : 7.5625 * (t -= 2.625 / 2.75) * t + .984375, e ? .5 * (1 - t) : .5 * t + .5
        })), u("Circ", l("CircOut", function (t) {
            return Math.sqrt(1 - (t -= 1) * t)
        }), l("CircIn", function (t) {
            return-(Math.sqrt(1 - t * t) - 1)
        }), l("CircInOut", function (t) {
            return 1 > (t *= 2) ? -.5 * (Math.sqrt(1 - t * t) - 1) : .5 * (Math.sqrt(1 - (t -= 2) * t) + 1)
        })), s = function (e, i, s) {
            var r = h("easing." + e, function (t, e) {
                this._p1 = t || 1, this._p2 = e || s, this._p3 = this._p2 / a * (Math.asin(1 / this._p1) || 0)
            }, !0), n = r.prototype = new t;
            return n.constructor = r, n.getRatio = i, n.config = function (t, e) {
                return new r(t, e)
            }, r
        }, u("Elastic", s("ElasticOut", function (t) {
            return this._p1 * Math.pow(2, -10 * t) * Math.sin((t - this._p3) * a / this._p2) + 1
        }, .3), s("ElasticIn", function (t) {
            return-(this._p1 * Math.pow(2, 10 * (t -= 1)) * Math.sin((t - this._p3) * a / this._p2))
        }, .3), s("ElasticInOut", function (t) {
            return 1 > (t *= 2) ? -.5 * this._p1 * Math.pow(2, 10 * (t -= 1)) * Math.sin((t - this._p3) * a / this._p2) : .5 * this._p1 * Math.pow(2, -10 * (t -= 1)) * Math.sin((t - this._p3) * a / this._p2) + 1
        }, .45)), u("Expo", l("ExpoOut", function (t) {
            return 1 - Math.pow(2, -10 * t)
        }), l("ExpoIn", function (t) {
            return Math.pow(2, 10 * (t - 1)) - .001
        }), l("ExpoInOut", function (t) {
            return 1 > (t *= 2) ? .5 * Math.pow(2, 10 * (t - 1)) : .5 * (2 - Math.pow(2, -10 * (t - 1)))
        })), u("Sine", l("SineOut", function (t) {
            return Math.sin(t * o)
        }), l("SineIn", function (t) {
            return-Math.cos(t * o) + 1
        }), l("SineInOut", function (t) {
            return-.5 * (Math.cos(Math.PI * t) - 1)
        })), h("easing.EaseLookup", {find: function (e) {
            return t.map[e]
        }}, !0), _(r.SlowMo, "SlowMo", "ease,"), _(i, "RoughEase", "ease,"), _(e, "SteppedEase", "ease,"), f
    }, !0)
}), window._gsDefine && window._gsQueue.pop()();
},{}],22:[function(require,module,exports){
/*!
 * VERSION: beta 1.11.0
 * DATE: 2013-10-21
 * UPDATES AND DOCS AT: http://www.greensock.com
 *
 * @license Copyright (c) 2008-2013, GreenSock. All rights reserved.
 * This work is subject to the terms at http://www.greensock.com/terms_of_use.html or for
 * Club GreenSock members, the software agreement that was issued with your membership.
 * 
 * @author: Jack Doyle, jack@greensock.com
 */
(window._gsQueue || (window._gsQueue = [])).push(function () {
    "use strict";
    window._gsDefine("plugins.CSSPlugin", ["plugins.TweenPlugin", "TweenLite"], function (t, e) {
        var i, s, r, n, a = function () {
            t.call(this, "css"), this._overwriteProps.length = 0, this.setRatio = a.prototype.setRatio
        }, o = {}, l = a.prototype = new t("css");
        l.constructor = a, a.version = "1.11.0", a.API = 2, a.defaultTransformPerspective = 0, l = "px", a.suffixMap = {top: l, right: l, bottom: l, left: l, width: l, height: l, fontSize: l, padding: l, margin: l, perspective: l};
        var h, u, _, p, f, c, d = /(?:\d|\-\d|\.\d|\-\.\d)+/g, m = /(?:\d|\-\d|\.\d|\-\.\d|\+=\d|\-=\d|\+=.\d|\-=\.\d)+/g, g = /(?:\+=|\-=|\-|\b)[\d\-\.]+[a-zA-Z0-9]*(?:%|\b)/gi, v = /[^\d\-\.]/g, y = /(?:\d|\-|\+|=|#|\.)*/g, T = /opacity *= *([^)]*)/, x = /opacity:([^;]*)/, w = /alpha\(opacity *=.+?\)/i, b = /^(rgb|hsl)/, P = /([A-Z])/g, S = /-([a-z])/gi, R = /(^(?:url\(\"|url\())|(?:(\"\))$|\)$)/gi, k = function (t, e) {
            return e.toUpperCase()
        }, C = /(?:Left|Right|Width)/i, A = /(M11|M12|M21|M22)=[\d\-\.e]+/gi, O = /progid\:DXImageTransform\.Microsoft\.Matrix\(.+?\)/i, D = /,(?=[^\)]*(?:\(|$))/gi, M = Math.PI / 180, L = 180 / Math.PI, N = {}, X = document, F = X.createElement("div"), I = X.createElement("img"), E = a._internals = {_specialProps: o}, Y = navigator.userAgent, z = function () {
            var t, e = Y.indexOf("Android"), i = X.createElement("div");
            return _ = -1 !== Y.indexOf("Safari") && -1 === Y.indexOf("Chrome") && (-1 === e || Number(Y.substr(e + 8, 1)) > 3), f = _ && 6 > Number(Y.substr(Y.indexOf("Version/") + 8, 1)), p = -1 !== Y.indexOf("Firefox"), /MSIE ([0-9]{1,}[\.0-9]{0,})/.exec(Y), c = parseFloat(RegExp.$1), i.innerHTML = "<a style='top:1px;opacity:.55;'>a</a>", t = i.getElementsByTagName("a")[0], t ? /^0.55/.test(t.style.opacity) : !1
        }(), U = function (t) {
            return T.test("string" == typeof t ? t : (t.currentStyle ? t.currentStyle.filter : t.style.filter) || "") ? parseFloat(RegExp.$1) / 100 : 1
        }, B = function (t) {
            window.console && console.log(t)
        }, j = "", V = "", q = function (t, e) {
            e = e || F;
            var i, s, r = e.style;
            if (void 0 !== r[t])return t;
            for (t = t.charAt(0).toUpperCase() + t.substr(1), i = ["O", "Moz", "ms", "Ms", "Webkit"], s = 5; --s > -1 && void 0 === r[i[s] + t];);
            return s >= 0 ? (V = 3 === s ? "ms" : i[s], j = "-" + V.toLowerCase() + "-", V + t) : null
        }, W = X.defaultView ? X.defaultView.getComputedStyle : function () {
        }, Q = a.getStyle = function (t, e, i, s, r) {
            var n;
            return z || "opacity" !== e ? (!s && t.style[e] ? n = t.style[e] : (i = i || W(t, null)) ? (t = i.getPropertyValue(e.replace(P, "-$1").toLowerCase()), n = t || i.length ? t : i[e]) : t.currentStyle && (n = t.currentStyle[e]), null == r || n && "none" !== n && "auto" !== n && "auto auto" !== n ? n : r) : U(t)
        }, Z = function (t, e, i, s, r) {
            if ("px" === s || !s)return i;
            if ("auto" === s || !i)return 0;
            var n, a = C.test(e), o = t, l = F.style, h = 0 > i;
            return h && (i = -i), "%" === s && -1 !== e.indexOf("border") ? n = i / 100 * (a ? t.clientWidth : t.clientHeight) : (l.cssText = "border-style:solid;border-width:0;position:absolute;line-height:0;", "%" !== s && o.appendChild ? l[a ? "borderLeftWidth" : "borderTopWidth"] = i + s : (o = t.parentNode || X.body, l[a ? "width" : "height"] = i + s), o.appendChild(F), n = parseFloat(F[a ? "offsetWidth" : "offsetHeight"]), o.removeChild(F), 0 !== n || r || (n = Z(t, e, i, s, !0))), h ? -n : n
        }, H = function (t, e, i) {
            if ("absolute" !== Q(t, "position", i))return 0;
            var s = "left" === e ? "Left" : "Top", r = Q(t, "margin" + s, i);
            return t["offset" + s] - (Z(t, e, parseFloat(r), r.replace(y, "")) || 0)
        }, $ = function (t, e) {
            var i, s, r = {};
            if (e = e || W(t, null))if (i = e.length)for (; --i > -1;)r[e[i].replace(S, k)] = e.getPropertyValue(e[i]); else for (i in e)r[i] = e[i]; else if (e = t.currentStyle || t.style)for (i in e)"string" == typeof i && void 0 !== r[i] && (r[i.replace(S, k)] = e[i]);
            return z || (r.opacity = U(t)), s = be(t, e, !1), r.rotation = s.rotation, r.skewX = s.skewX, r.scaleX = s.scaleX, r.scaleY = s.scaleY, r.x = s.x, r.y = s.y, we && (r.z = s.z, r.rotationX = s.rotationX, r.rotationY = s.rotationY, r.scaleZ = s.scaleZ), r.filters && delete r.filters, r
        }, G = function (t, e, i, s, r) {
            var n, a, o, l = {}, h = t.style;
            for (a in i)"cssText" !== a && "length" !== a && isNaN(a) && (e[a] !== (n = i[a]) || r && r[a]) && -1 === a.indexOf("Origin") && ("number" == typeof n || "string" == typeof n) && (l[a] = "auto" !== n || "left" !== a && "top" !== a ? "" !== n && "auto" !== n && "none" !== n || "string" != typeof e[a] || "" === e[a].replace(v, "") ? n : 0 : H(t, a), void 0 !== h[a] && (o = new _e(h, a, h[a], o)));
            if (s)for (a in s)"className" !== a && (l[a] = s[a]);
            return{difs: l, firstMPT: o}
        }, K = {width: ["Left", "Right"], height: ["Top", "Bottom"]}, J = ["marginLeft", "marginRight", "marginTop", "marginBottom"], te = function (t, e, i) {
            var s = parseFloat("width" === e ? t.offsetWidth : t.offsetHeight), r = K[e], n = r.length;
            for (i = i || W(t, null); --n > -1;)s -= parseFloat(Q(t, "padding" + r[n], i, !0)) || 0, s -= parseFloat(Q(t, "border" + r[n] + "Width", i, !0)) || 0;
            return s
        }, ee = function (t, e) {
            (null == t || "" === t || "auto" === t || "auto auto" === t) && (t = "0 0");
            var i = t.split(" "), s = -1 !== t.indexOf("left") ? "0%" : -1 !== t.indexOf("right") ? "100%" : i[0], r = -1 !== t.indexOf("top") ? "0%" : -1 !== t.indexOf("bottom") ? "100%" : i[1];
            return null == r ? r = "0" : "center" === r && (r = "50%"), ("center" === s || isNaN(parseFloat(s)) && -1 === (s + "").indexOf("=")) && (s = "50%"), e && (e.oxp = -1 !== s.indexOf("%"), e.oyp = -1 !== r.indexOf("%"), e.oxr = "=" === s.charAt(1), e.oyr = "=" === r.charAt(1), e.ox = parseFloat(s.replace(v, "")), e.oy = parseFloat(r.replace(v, ""))), s + " " + r + (i.length > 2 ? " " + i[2] : "")
        }, ie = function (t, e) {
            return"string" == typeof t && "=" === t.charAt(1) ? parseInt(t.charAt(0) + "1", 10) * parseFloat(t.substr(2)) : parseFloat(t) - parseFloat(e)
        }, se = function (t, e) {
            return null == t ? e : "string" == typeof t && "=" === t.charAt(1) ? parseInt(t.charAt(0) + "1", 10) * Number(t.substr(2)) + e : parseFloat(t)
        }, re = function (t, e, i, s) {
            var r, n, a, o, l = 1e-6;
            return null == t ? o = e : "number" == typeof t ? o = t : (r = 360, n = t.split("_"), a = Number(n[0].replace(v, "")) * (-1 === t.indexOf("rad") ? 1 : L) - ("=" === t.charAt(1) ? 0 : e), n.length && (s && (s[i] = e + a), -1 !== t.indexOf("short") && (a %= r, a !== a % (r / 2) && (a = 0 > a ? a + r : a - r)), -1 !== t.indexOf("_cw") && 0 > a ? a = (a + 9999999999 * r) % r - (0 | a / r) * r : -1 !== t.indexOf("ccw") && a > 0 && (a = (a - 9999999999 * r) % r - (0 | a / r) * r)), o = e + a), l > o && o > -l && (o = 0), o
        }, ne = {aqua: [0, 255, 255], lime: [0, 255, 0], silver: [192, 192, 192], black: [0, 0, 0], maroon: [128, 0, 0], teal: [0, 128, 128], blue: [0, 0, 255], navy: [0, 0, 128], white: [255, 255, 255], fuchsia: [255, 0, 255], olive: [128, 128, 0], yellow: [255, 255, 0], orange: [255, 165, 0], gray: [128, 128, 128], purple: [128, 0, 128], green: [0, 128, 0], red: [255, 0, 0], pink: [255, 192, 203], cyan: [0, 255, 255], transparent: [255, 255, 255, 0]}, ae = function (t, e, i) {
            return t = 0 > t ? t + 1 : t > 1 ? t - 1 : t, 0 | 255 * (1 > 6 * t ? e + 6 * (i - e) * t : .5 > t ? i : 2 > 3 * t ? e + 6 * (i - e) * (2 / 3 - t) : e) + .5
        }, oe = function (t) {
            var e, i, s, r, n, a;
            return t && "" !== t ? "number" == typeof t ? [t >> 16, 255 & t >> 8, 255 & t] : ("," === t.charAt(t.length - 1) && (t = t.substr(0, t.length - 1)), ne[t] ? ne[t] : "#" === t.charAt(0) ? (4 === t.length && (e = t.charAt(1), i = t.charAt(2), s = t.charAt(3), t = "#" + e + e + i + i + s + s), t = parseInt(t.substr(1), 16), [t >> 16, 255 & t >> 8, 255 & t]) : "hsl" === t.substr(0, 3) ? (t = t.match(d), r = Number(t[0]) % 360 / 360, n = Number(t[1]) / 100, a = Number(t[2]) / 100, i = .5 >= a ? a * (n + 1) : a + n - a * n, e = 2 * a - i, t.length > 3 && (t[3] = Number(t[3])), t[0] = ae(r + 1 / 3, e, i), t[1] = ae(r, e, i), t[2] = ae(r - 1 / 3, e, i), t) : (t = t.match(d) || ne.transparent, t[0] = Number(t[0]), t[1] = Number(t[1]), t[2] = Number(t[2]), t.length > 3 && (t[3] = Number(t[3])), t)) : ne.black
        }, le = "(?:\\b(?:(?:rgb|rgba|hsl|hsla)\\(.+?\\))|\\B#.+?\\b";
        for (l in ne)le += "|" + l + "\\b";
        le = RegExp(le + ")", "gi");
        var he = function (t, e, i, s) {
            if (null == t)return function (t) {
                return t
            };
            var r, n = e ? (t.match(le) || [""])[0] : "", a = t.split(n).join("").match(g) || [], o = t.substr(0, t.indexOf(a[0])), l = ")" === t.charAt(t.length - 1) ? ")" : "", h = -1 !== t.indexOf(" ") ? " " : ",", u = a.length, _ = u > 0 ? a[0].replace(d, "") : "";
            return u ? r = e ? function (t) {
                var e, p, f, c;
                if ("number" == typeof t)t += _; else if (s && D.test(t)) {
                    for (c = t.replace(D, "|").split("|"), f = 0; c.length > f; f++)c[f] = r(c[f]);
                    return c.join(",")
                }
                if (e = (t.match(le) || [n])[0], p = t.split(e).join("").match(g) || [], f = p.length, u > f--)for (; u > ++f;)p[f] = i ? p[0 | (f - 1) / 2] : a[f];
                return o + p.join(h) + h + e + l + (-1 !== t.indexOf("inset") ? " inset" : "")
            } : function (t) {
                var e, n, p;
                if ("number" == typeof t)t += _; else if (s && D.test(t)) {
                    for (n = t.replace(D, "|").split("|"), p = 0; n.length > p; p++)n[p] = r(n[p]);
                    return n.join(",")
                }
                if (e = t.match(g) || [], p = e.length, u > p--)for (; u > ++p;)e[p] = i ? e[0 | (p - 1) / 2] : a[p];
                return o + e.join(h) + l
            } : function (t) {
                return t
            }
        }, ue = function (t) {
            return t = t.split(","), function (e, i, s, r, n, a, o) {
                var l, h = (i + "").split(" ");
                for (o = {}, l = 0; 4 > l; l++)o[t[l]] = h[l] = h[l] || h[(l - 1) / 2 >> 0];
                return r.parse(e, o, n, a)
            }
        }, _e = (E._setPluginRatio = function (t) {
            this.plugin.setRatio(t);
            for (var e, i, s, r, n = this.data, a = n.proxy, o = n.firstMPT, l = 1e-6; o;)e = a[o.v], o.r ? e = e > 0 ? 0 | e + .5 : 0 | e - .5 : l > e && e > -l && (e = 0), o.t[o.p] = e, o = o._next;
            if (n.autoRotate && (n.autoRotate.rotation = a.rotation), 1 === t)for (o = n.firstMPT; o;) {
                if (i = o.t, i.type) {
                    if (1 === i.type) {
                        for (r = i.xs0 + i.s + i.xs1, s = 1; i.l > s; s++)r += i["xn" + s] + i["xs" + (s + 1)];
                        i.e = r
                    }
                } else i.e = i.s + i.xs0;
                o = o._next
            }
        }, function (t, e, i, s, r) {
            this.t = t, this.p = e, this.v = i, this.r = r, s && (s._prev = this, this._next = s)
        }), pe = (E._parseToProxy = function (t, e, i, s, r, n) {
            var a, o, l, h, u, _ = s, p = {}, f = {}, c = i._transform, d = N;
            for (i._transform = null, N = e, s = u = i.parse(t, e, s, r), N = d, n && (i._transform = c, _ && (_._prev = null, _._prev && (_._prev._next = null))); s && s !== _;) {
                if (1 >= s.type && (o = s.p, f[o] = s.s + s.c, p[o] = s.s, n || (h = new _e(s, "s", o, h, s.r), s.c = 0), 1 === s.type))for (a = s.l; --a > 0;)l = "xn" + a, o = s.p + "_" + l, f[o] = s.data[l], p[o] = s[l], n || (h = new _e(s, l, o, h, s.rxp[l]));
                s = s._next
            }
            return{proxy: p, end: f, firstMPT: h, pt: u}
        }, E.CSSPropTween = function (t, e, s, r, a, o, l, h, u, _, p) {
            this.t = t, this.p = e, this.s = s, this.c = r, this.n = l || e, t instanceof pe || n.push(this.n), this.r = h, this.type = o || 0, u && (this.pr = u, i = !0), this.b = void 0 === _ ? s : _, this.e = void 0 === p ? s + r : p, a && (this._next = a, a._prev = this)
        }), fe = a.parseComplex = function (t, e, i, s, r, n, a, o, l, u) {
            i = i || n || "", a = new pe(t, e, 0, 0, a, u ? 2 : 1, null, !1, o, i, s), s += "";
            var _, p, f, c, g, v, y, T, x, w, P, S, R = i.split(", ").join(",").split(" "), k = s.split(", ").join(",").split(" "), C = R.length, A = h !== !1;
            for ((-1 !== s.indexOf(",") || -1 !== i.indexOf(",")) && (R = R.join(" ").replace(D, ", ").split(" "), k = k.join(" ").replace(D, ", ").split(" "), C = R.length), C !== k.length && (R = (n || "").split(" "), C = R.length), a.plugin = l, a.setRatio = u, _ = 0; C > _; _++)if (c = R[_], g = k[_], T = parseFloat(c), T || 0 === T)a.appendXtra("", T, ie(g, T), g.replace(m, ""), A && -1 !== g.indexOf("px"), !0); else if (r && ("#" === c.charAt(0) || ne[c] || b.test(c)))S = "," === g.charAt(g.length - 1) ? ")," : ")", c = oe(c), g = oe(g), x = c.length + g.length > 6, x && !z && 0 === g[3] ? (a["xs" + a.l] += a.l ? " transparent" : "transparent", a.e = a.e.split(k[_]).join("transparent")) : (z || (x = !1), a.appendXtra(x ? "rgba(" : "rgb(", c[0], g[0] - c[0], ",", !0, !0).appendXtra("", c[1], g[1] - c[1], ",", !0).appendXtra("", c[2], g[2] - c[2], x ? "," : S, !0), x && (c = 4 > c.length ? 1 : c[3], a.appendXtra("", c, (4 > g.length ? 1 : g[3]) - c, S, !1))); else if (v = c.match(d)) {
                if (y = g.match(m), !y || y.length !== v.length)return a;
                for (f = 0, p = 0; v.length > p; p++)P = v[p], w = c.indexOf(P, f), a.appendXtra(c.substr(f, w - f), Number(P), ie(y[p], P), "", A && "px" === c.substr(w + P.length, 2), 0 === p), f = w + P.length;
                a["xs" + a.l] += c.substr(f)
            } else a["xs" + a.l] += a.l ? " " + c : c;
            if (-1 !== s.indexOf("=") && a.data) {
                for (S = a.xs0 + a.data.s, _ = 1; a.l > _; _++)S += a["xs" + _] + a.data["xn" + _];
                a.e = S + a["xs" + _]
            }
            return a.l || (a.type = -1, a.xs0 = a.e), a.xfirst || a
        }, ce = 9;
        for (l = pe.prototype, l.l = l.pr = 0; --ce > 0;)l["xn" + ce] = 0, l["xs" + ce] = "";
        l.xs0 = "", l._next = l._prev = l.xfirst = l.data = l.plugin = l.setRatio = l.rxp = null, l.appendXtra = function (t, e, i, s, r, n) {
            var a = this, o = a.l;
            return a["xs" + o] += n && o ? " " + t : t || "", i || 0 === o || a.plugin ? (a.l++, a.type = a.setRatio ? 2 : 1, a["xs" + a.l] = s || "", o > 0 ? (a.data["xn" + o] = e + i, a.rxp["xn" + o] = r, a["xn" + o] = e, a.plugin || (a.xfirst = new pe(a, "xn" + o, e, i, a.xfirst || a, 0, a.n, r, a.pr), a.xfirst.xs0 = 0), a) : (a.data = {s: e + i}, a.rxp = {}, a.s = e, a.c = i, a.r = r, a)) : (a["xs" + o] += e + (s || ""), a)
        };
        var de = function (t, e) {
            e = e || {}, this.p = e.prefix ? q(t) || t : t, o[t] = o[this.p] = this, this.format = e.formatter || he(e.defaultValue, e.color, e.collapsible, e.multi), e.parser && (this.parse = e.parser), this.clrs = e.color, this.multi = e.multi, this.keyword = e.keyword, this.dflt = e.defaultValue, this.pr = e.priority || 0
        }, me = E._registerComplexSpecialProp = function (t, e, i) {
            "object" != typeof e && (e = {parser: i});
            var s, r, n = t.split(","), a = e.defaultValue;
            for (i = i || [a], s = 0; n.length > s; s++)e.prefix = 0 === s && e.prefix, e.defaultValue = i[s] || a, r = new de(n[s], e)
        }, ge = function (t) {
            if (!o[t]) {
                var e = t.charAt(0).toUpperCase() + t.substr(1) + "Plugin";
                me(t, {parser: function (t, i, s, r, n, a, l) {
                    var h = (window.GreenSockGlobals || window).com.greensock.plugins[e];
                    return h ? (h._cssRegister(), o[s].parse(t, i, s, r, n, a, l)) : (B("Error: " + e + " js file not loaded."), n)
                }})
            }
        };
        l = de.prototype, l.parseComplex = function (t, e, i, s, r, n) {
            var a, o, l, h, u, _, p = this.keyword;
            if (this.multi && (D.test(i) || D.test(e) ? (o = e.replace(D, "|").split("|"), l = i.replace(D, "|").split("|")) : p && (o = [e], l = [i])), l) {
                for (h = l.length > o.length ? l.length : o.length, a = 0; h > a; a++)e = o[a] = o[a] || this.dflt, i = l[a] = l[a] || this.dflt, p && (u = e.indexOf(p), _ = i.indexOf(p), u !== _ && (i = -1 === _ ? l : o, i[a] += " " + p));
                e = o.join(", "), i = l.join(", ")
            }
            return fe(t, this.p, e, i, this.clrs, this.dflt, s, this.pr, r, n)
        }, l.parse = function (t, e, i, s, n, a) {
            return this.parseComplex(t.style, this.format(Q(t, this.p, r, !1, this.dflt)), this.format(e), n, a)
        }, a.registerSpecialProp = function (t, e, i) {
            me(t, {parser: function (t, s, r, n, a, o) {
                var l = new pe(t, r, 0, 0, a, 2, r, !1, i);
                return l.plugin = o, l.setRatio = e(t, s, n._tween, r), l
            }, priority: i})
        };
        var ve = "scaleX,scaleY,scaleZ,x,y,z,skewX,rotation,rotationX,rotationY,perspective".split(","), ye = q("transform"), Te = j + "transform", xe = q("transformOrigin"), we = null !== q("perspective"), be = function (t, e, i, s) {
            if (t._gsTransform && i && !s)return t._gsTransform;
            var r, n, o, l, h, u, _, p, f, c, d, m, g, v = i ? t._gsTransform || {skewY: 0} : {skewY: 0}, y = 0 > v.scaleX, T = 2e-5, x = 1e5, w = 179.99, b = w * M, P = we ? parseFloat(Q(t, xe, e, !1, "0 0 0").split(" ")[2]) || v.zOrigin || 0 : 0;
            for (ye ? r = Q(t, Te, e, !0) : t.currentStyle && (r = t.currentStyle.filter.match(A), r = r && 4 === r.length ? [r[0].substr(4), Number(r[2].substr(4)), Number(r[1].substr(4)), r[3].substr(4), v.x || 0, v.y || 0].join(",") : ""), n = (r || "").match(/(?:\-|\b)[\d\-\.e]+\b/gi) || [], o = n.length; --o > -1;)l = Number(n[o]), n[o] = (h = l - (l |= 0)) ? (0 | h * x + (0 > h ? -.5 : .5)) / x + l : l;
            if (16 === n.length) {
                var S = n[8], R = n[9], k = n[10], C = n[12], O = n[13], D = n[14];
                if (v.zOrigin && (D = -v.zOrigin, C = S * D - n[12], O = R * D - n[13], D = k * D + v.zOrigin - n[14]), !i || s || null == v.rotationX) {
                    var N, X, F, I, E, Y, z, U = n[0], B = n[1], j = n[2], V = n[3], q = n[4], W = n[5], Z = n[6], H = n[7], $ = n[11], G = Math.atan2(Z, k), K = -b > G || G > b;
                    v.rotationX = G * L, G && (I = Math.cos(-G), E = Math.sin(-G), N = q * I + S * E, X = W * I + R * E, F = Z * I + k * E, S = q * -E + S * I, R = W * -E + R * I, k = Z * -E + k * I, $ = H * -E + $ * I, q = N, W = X, Z = F), G = Math.atan2(S, U), v.rotationY = G * L, G && (Y = -b > G || G > b, I = Math.cos(-G), E = Math.sin(-G), N = U * I - S * E, X = B * I - R * E, F = j * I - k * E, R = B * E + R * I, k = j * E + k * I, $ = V * E + $ * I, U = N, B = X, j = F), G = Math.atan2(B, W), v.rotation = G * L, G && (z = -b > G || G > b, I = Math.cos(-G), E = Math.sin(-G), U = U * I + q * E, X = B * I + W * E, W = B * -E + W * I, Z = j * -E + Z * I, B = X), z && K ? v.rotation = v.rotationX = 0 : z && Y ? v.rotation = v.rotationY = 0 : Y && K && (v.rotationY = v.rotationX = 0), v.scaleX = (0 | Math.sqrt(U * U + B * B) * x + .5) / x, v.scaleY = (0 | Math.sqrt(W * W + R * R) * x + .5) / x, v.scaleZ = (0 | Math.sqrt(Z * Z + k * k) * x + .5) / x, v.skewX = 0, v.perspective = $ ? 1 / (0 > $ ? -$ : $) : 0, v.x = C, v.y = O, v.z = D
                }
            } else if (!(we && !s && n.length && v.x === n[4] && v.y === n[5] && (v.rotationX || v.rotationY) || void 0 !== v.x && "none" === Q(t, "display", e))) {
                var J = n.length >= 6, te = J ? n[0] : 1, ee = n[1] || 0, ie = n[2] || 0, se = J ? n[3] : 1;
                v.x = n[4] || 0, v.y = n[5] || 0, u = Math.sqrt(te * te + ee * ee), _ = Math.sqrt(se * se + ie * ie), p = te || ee ? Math.atan2(ee, te) * L : v.rotation || 0, f = ie || se ? Math.atan2(ie, se) * L + p : v.skewX || 0, c = u - Math.abs(v.scaleX || 0), d = _ - Math.abs(v.scaleY || 0), Math.abs(f) > 90 && 270 > Math.abs(f) && (y ? (u *= -1, f += 0 >= p ? 180 : -180, p += 0 >= p ? 180 : -180) : (_ *= -1, f += 0 >= f ? 180 : -180)), m = (p - v.rotation) % 180, g = (f - v.skewX) % 180, (void 0 === v.skewX || c > T || -T > c || d > T || -T > d || m > -w && w > m && false | m * x || g > -w && w > g && false | g * x) && (v.scaleX = u, v.scaleY = _, v.rotation = p, v.skewX = f), we && (v.rotationX = v.rotationY = v.z = 0, v.perspective = parseFloat(a.defaultTransformPerspective) || 0, v.scaleZ = 1)
            }
            v.zOrigin = P;
            for (o in v)T > v[o] && v[o] > -T && (v[o] = 0);
            return i && (t._gsTransform = v), v
        }, Pe = function (t) {
            var e, i, s = this.data, r = -s.rotation * M, n = r + s.skewX * M, a = 1e5, o = (0 | Math.cos(r) * s.scaleX * a) / a, l = (0 | Math.sin(r) * s.scaleX * a) / a, h = (0 | Math.sin(n) * -s.scaleY * a) / a, u = (0 | Math.cos(n) * s.scaleY * a) / a, _ = this.t.style, p = this.t.currentStyle;
            if (p) {
                i = l, l = -h, h = -i, e = p.filter, _.filter = "";
                var f, d, m = this.t.offsetWidth, g = this.t.offsetHeight, v = "absolute" !== p.position, x = "progid:DXImageTransform.Microsoft.Matrix(M11=" + o + ", M12=" + l + ", M21=" + h + ", M22=" + u, w = s.x, b = s.y;
                if (null != s.ox && (f = (s.oxp ? .01 * m * s.ox : s.ox) - m / 2, d = (s.oyp ? .01 * g * s.oy : s.oy) - g / 2, w += f - (f * o + d * l), b += d - (f * h + d * u)), v ? (f = m / 2, d = g / 2, x += ", Dx=" + (f - (f * o + d * l) + w) + ", Dy=" + (d - (f * h + d * u) + b) + ")") : x += ", sizingMethod='auto expand')", _.filter = -1 !== e.indexOf("DXImageTransform.Microsoft.Matrix(") ? e.replace(O, x) : x + " " + e, (0 === t || 1 === t) && 1 === o && 0 === l && 0 === h && 1 === u && (v && -1 === x.indexOf("Dx=0, Dy=0") || T.test(e) && 100 !== parseFloat(RegExp.$1) || -1 === e.indexOf("gradient(" && e.indexOf("Alpha")) && _.removeAttribute("filter")), !v) {
                    var P, S, R, k = 8 > c ? 1 : -1;
                    for (f = s.ieOffsetX || 0, d = s.ieOffsetY || 0, s.ieOffsetX = Math.round((m - ((0 > o ? -o : o) * m + (0 > l ? -l : l) * g)) / 2 + w), s.ieOffsetY = Math.round((g - ((0 > u ? -u : u) * g + (0 > h ? -h : h) * m)) / 2 + b), ce = 0; 4 > ce; ce++)S = J[ce], P = p[S], i = -1 !== P.indexOf("px") ? parseFloat(P) : Z(this.t, S, parseFloat(P), P.replace(y, "")) || 0, R = i !== s[S] ? 2 > ce ? -s.ieOffsetX : -s.ieOffsetY : 2 > ce ? f - s.ieOffsetX : d - s.ieOffsetY, _[S] = (s[S] = Math.round(i - R * (0 === ce || 2 === ce ? 1 : k))) + "px"
                }
            }
        }, Se = function () {
            var t, e, i, s, r, n, a, o, l, h, u, _, f, c, d, m, g, v, y, T, x, w, b, P, S, R, k = this.data, C = this.t.style, A = k.rotation * M, O = k.scaleX, D = k.scaleY, L = k.scaleZ, N = k.perspective;
            if (p && (P = C.top ? "top" : C.bottom ? "bottom" : parseFloat(Q(this.t, "top", null, !1)) ? "bottom" : "top", T = Q(this.t, P, null, !1), S = parseFloat(T) || 0, R = T.substr((S + "").length) || "px", k._ffFix = !k._ffFix, C[P] = (k._ffFix ? S + .05 : S - .05) + R), A || k.skewX)v = Math.cos(A), y = Math.sin(A), t = v, r = y, k.skewX && (A -= k.skewX * M, v = Math.cos(A), y = Math.sin(A)), e = -y, n = v; else {
                if (!(k.rotationY || k.rotationX || 1 !== L || N))return C[ye] = "translate3d(" + k.x + "px," + k.y + "px," + k.z + "px)" + (1 !== O || 1 !== D ? " scale(" + O + "," + D + ")" : ""), void 0;
                t = n = 1, e = r = 0
            }
            u = 1, i = s = a = o = l = h = _ = f = c = 0, d = N ? -1 / N : 0, m = k.zOrigin, g = 1e5, A = k.rotationY * M, A && (v = Math.cos(A), y = Math.sin(A), l = u * -y, f = d * -y, i = t * y, a = r * y, u *= v, d *= v, t *= v, r *= v), A = k.rotationX * M, A && (v = Math.cos(A), y = Math.sin(A), T = e * v + i * y, x = n * v + a * y, w = h * v + u * y, b = c * v + d * y, i = e * -y + i * v, a = n * -y + a * v, u = h * -y + u * v, d = c * -y + d * v, e = T, n = x, h = w, c = b), 1 !== L && (i *= L, a *= L, u *= L, d *= L), 1 !== D && (e *= D, n *= D, h *= D, c *= D), 1 !== O && (t *= O, r *= O, l *= O, f *= O), m && (_ -= m, s = i * _, o = a * _, _ = u * _ + m), s = (T = (s += k.x) - (s |= 0)) ? (0 | T * g + (0 > T ? -.5 : .5)) / g + s : s, o = (T = (o += k.y) - (o |= 0)) ? (0 | T * g + (0 > T ? -.5 : .5)) / g + o : o, _ = (T = (_ += k.z) - (_ |= 0)) ? (0 | T * g + (0 > T ? -.5 : .5)) / g + _ : _, C[ye] = "matrix3d(" + [(0 | t * g) / g, (0 | r * g) / g, (0 | l * g) / g, (0 | f * g) / g, (0 | e * g) / g, (0 | n * g) / g, (0 | h * g) / g, (0 | c * g) / g, (0 | i * g) / g, (0 | a * g) / g, (0 | u * g) / g, (0 | d * g) / g, s, o, _, N ? 1 + -_ / N : 1].join(",") + ")"
        }, Re = function () {
            var t, e, i, s, r, n, a, o, l, h = this.data, u = this.t, _ = u.style;
            p && (t = _.top ? "top" : _.bottom ? "bottom" : parseFloat(Q(u, "top", null, !1)) ? "bottom" : "top", e = Q(u, t, null, !1), i = parseFloat(e) || 0, s = e.substr((i + "").length) || "px", h._ffFix = !h._ffFix, _[t] = (h._ffFix ? i + .05 : i - .05) + s), h.rotation || h.skewX ? (r = h.rotation * M, n = r - h.skewX * M, a = 1e5, o = h.scaleX * a, l = h.scaleY * a, _[ye] = "matrix(" + (0 | Math.cos(r) * o) / a + "," + (0 | Math.sin(r) * o) / a + "," + (0 | Math.sin(n) * -l) / a + "," + (0 | Math.cos(n) * l) / a + "," + h.x + "," + h.y + ")") : _[ye] = "matrix(" + h.scaleX + ",0,0," + h.scaleY + "," + h.x + "," + h.y + ")"
        };
        me("transform,scale,scaleX,scaleY,scaleZ,x,y,z,rotation,rotationX,rotationY,rotationZ,skewX,skewY,shortRotation,shortRotationX,shortRotationY,shortRotationZ,transformOrigin,transformPerspective,directionalRotation,parseTransform,force3D", {parser: function (t, e, i, s, n, a, o) {
            if (s._transform)return n;
            var l, h, u, _, p, f, c, d = s._transform = be(t, r, !0, o.parseTransform), m = t.style, g = 1e-6, v = ve.length, y = o, T = {};
            if ("string" == typeof y.transform && ye)u = m.cssText, m[ye] = y.transform, m.display = "block", l = be(t, null, !1), m.cssText = u; else if ("object" == typeof y) {
                if (l = {scaleX: se(null != y.scaleX ? y.scaleX : y.scale, d.scaleX), scaleY: se(null != y.scaleY ? y.scaleY : y.scale, d.scaleY), scaleZ: se(null != y.scaleZ ? y.scaleZ : y.scale, d.scaleZ), x: se(y.x, d.x), y: se(y.y, d.y), z: se(y.z, d.z), perspective: se(y.transformPerspective, d.perspective)}, c = y.directionalRotation, null != c)if ("object" == typeof c)for (u in c)y[u] = c[u]; else y.rotation = c;
                l.rotation = re("rotation"in y ? y.rotation : "shortRotation"in y ? y.shortRotation + "_short" : "rotationZ"in y ? y.rotationZ : d.rotation, d.rotation, "rotation", T), we && (l.rotationX = re("rotationX"in y ? y.rotationX : "shortRotationX"in y ? y.shortRotationX + "_short" : d.rotationX || 0, d.rotationX, "rotationX", T), l.rotationY = re("rotationY"in y ? y.rotationY : "shortRotationY"in y ? y.shortRotationY + "_short" : d.rotationY || 0, d.rotationY, "rotationY", T)), l.skewX = null == y.skewX ? d.skewX : re(y.skewX, d.skewX), l.skewY = null == y.skewY ? d.skewY : re(y.skewY, d.skewY), (h = l.skewY - d.skewY) && (l.skewX += h, l.rotation += h)
            }
            for (null != y.force3D && (d.force3D = y.force3D, f = !0), p = d.force3D || d.z || d.rotationX || d.rotationY || l.z || l.rotationX || l.rotationY || l.perspective, p || null == y.scale || (l.scaleZ = 1); --v > -1;)i = ve[v], _ = l[i] - d[i], (_ > g || -g > _ || null != N[i]) && (f = !0, n = new pe(d, i, d[i], _, n), i in T && (n.e = T[i]), n.xs0 = 0, n.plugin = a, s._overwriteProps.push(n.n));
            return _ = y.transformOrigin, (_ || we && p && d.zOrigin) && (ye ? (f = !0, i = xe, _ = (_ || Q(t, i, r, !1, "50% 50%")) + "", n = new pe(m, i, 0, 0, n, -1, "transformOrigin"), n.b = m[i], n.plugin = a, we ? (u = d.zOrigin, _ = _.split(" "), d.zOrigin = (_.length > 2 && (0 === u || "0px" !== _[2]) ? parseFloat(_[2]) : u) || 0, n.xs0 = n.e = m[i] = _[0] + " " + (_[1] || "50%") + " 0px", n = new pe(d, "zOrigin", 0, 0, n, -1, n.n), n.b = u, n.xs0 = n.e = d.zOrigin) : n.xs0 = n.e = m[i] = _) : ee(_ + "", d)), f && (s._transformType = p || 3 === this._transformType ? 3 : 2), n
        }, prefix: !0}), me("boxShadow", {defaultValue: "0px 0px 0px 0px #999", prefix: !0, color: !0, multi: !0, keyword: "inset"}), me("borderRadius", {defaultValue: "0px", parser: function (t, e, i, n, a) {
            e = this.format(e);
            var o, l, h, u, _, p, f, c, d, m, g, v, y, T, x, w, b = ["borderTopLeftRadius", "borderTopRightRadius", "borderBottomRightRadius", "borderBottomLeftRadius"], P = t.style;
            for (d = parseFloat(t.offsetWidth), m = parseFloat(t.offsetHeight), o = e.split(" "), l = 0; b.length > l; l++)this.p.indexOf("border") && (b[l] = q(b[l])), _ = u = Q(t, b[l], r, !1, "0px"), -1 !== _.indexOf(" ") && (u = _.split(" "), _ = u[0], u = u[1]), p = h = o[l], f = parseFloat(_), v = _.substr((f + "").length), y = "=" === p.charAt(1), y ? (c = parseInt(p.charAt(0) + "1", 10), p = p.substr(2), c *= parseFloat(p), g = p.substr((c + "").length - (0 > c ? 1 : 0)) || "") : (c = parseFloat(p), g = p.substr((c + "").length)), "" === g && (g = s[i] || v), g !== v && (T = Z(t, "borderLeft", f, v), x = Z(t, "borderTop", f, v), "%" === g ? (_ = 100 * (T / d) + "%", u = 100 * (x / m) + "%") : "em" === g ? (w = Z(t, "borderLeft", 1, "em"), _ = T / w + "em", u = x / w + "em") : (_ = T + "px", u = x + "px"), y && (p = parseFloat(_) + c + g, h = parseFloat(u) + c + g)), a = fe(P, b[l], _ + " " + u, p + " " + h, !1, "0px", a);
            return a
        }, prefix: !0, formatter: he("0px 0px 0px 0px", !1, !0)}), me("backgroundPosition", {defaultValue: "0 0", parser: function (t, e, i, s, n, a) {
            var o, l, h, u, _, p, f = "background-position", d = r || W(t, null), m = this.format((d ? c ? d.getPropertyValue(f + "-x") + " " + d.getPropertyValue(f + "-y") : d.getPropertyValue(f) : t.currentStyle.backgroundPositionX + " " + t.currentStyle.backgroundPositionY) || "0 0"), g = this.format(e);
            if (-1 !== m.indexOf("%") != (-1 !== g.indexOf("%")) && (p = Q(t, "backgroundImage").replace(R, ""), p && "none" !== p)) {
                for (o = m.split(" "), l = g.split(" "), I.setAttribute("src", p), h = 2; --h > -1;)m = o[h], u = -1 !== m.indexOf("%"), u !== (-1 !== l[h].indexOf("%")) && (_ = 0 === h ? t.offsetWidth - I.width : t.offsetHeight - I.height, o[h] = u ? parseFloat(m) / 100 * _ + "px" : 100 * (parseFloat(m) / _) + "%");
                m = o.join(" ")
            }
            return this.parseComplex(t.style, m, g, n, a)
        }, formatter: ee}), me("backgroundSize", {defaultValue: "0 0", formatter: ee}), me("perspective", {defaultValue: "0px", prefix: !0}), me("perspectiveOrigin", {defaultValue: "50% 50%", prefix: !0}), me("transformStyle", {prefix: !0}), me("backfaceVisibility", {prefix: !0}), me("userSelect", {prefix: !0}), me("margin", {parser: ue("marginTop,marginRight,marginBottom,marginLeft")}), me("padding", {parser: ue("paddingTop,paddingRight,paddingBottom,paddingLeft")}), me("clip", {defaultValue: "rect(0px,0px,0px,0px)", parser: function (t, e, i, s, n, a) {
            var o, l, h;
            return 9 > c ? (l = t.currentStyle, h = 8 > c ? " " : ",", o = "rect(" + l.clipTop + h + l.clipRight + h + l.clipBottom + h + l.clipLeft + ")", e = this.format(e).split(",").join(h)) : (o = this.format(Q(t, this.p, r, !1, this.dflt)), e = this.format(e)), this.parseComplex(t.style, o, e, n, a)
        }}), me("textShadow", {defaultValue: "0px 0px 0px #999", color: !0, multi: !0}), me("autoRound,strictUnits", {parser: function (t, e, i, s, r) {
            return r
        }}), me("border", {defaultValue: "0px solid #000", parser: function (t, e, i, s, n, a) {
            return this.parseComplex(t.style, this.format(Q(t, "borderTopWidth", r, !1, "0px") + " " + Q(t, "borderTopStyle", r, !1, "solid") + " " + Q(t, "borderTopColor", r, !1, "#000")), this.format(e), n, a)
        }, color: !0, formatter: function (t) {
            var e = t.split(" ");
            return e[0] + " " + (e[1] || "solid") + " " + (t.match(le) || ["#000"])[0]
        }}), me("float,cssFloat,styleFloat", {parser: function (t, e, i, s, r) {
            var n = t.style, a = "cssFloat"in n ? "cssFloat" : "styleFloat";
            return new pe(n, a, 0, 0, r, -1, i, !1, 0, n[a], e)
        }});
        var ke = function (t) {
            var e, i = this.t, s = i.filter || Q(this.data, "filter"), r = 0 | this.s + this.c * t;
            100 === r && (-1 === s.indexOf("atrix(") && -1 === s.indexOf("radient(") && -1 === s.indexOf("oader(") ? (i.removeAttribute("filter"), e = !Q(this.data, "filter")) : (i.filter = s.replace(w, ""), e = !0)), e || (this.xn1 && (i.filter = s = s || "alpha(opacity=" + r + ")"), -1 === s.indexOf("opacity") ? 0 === r && this.xn1 || (i.filter = s + " alpha(opacity=" + r + ")") : i.filter = s.replace(T, "opacity=" + r))
        };
        me("opacity,alpha,autoAlpha", {defaultValue: "1", parser: function (t, e, i, s, n, a) {
            var o = parseFloat(Q(t, "opacity", r, !1, "1")), l = t.style, h = "autoAlpha" === i;
            return"string" == typeof e && "=" === e.charAt(1) && (e = ("-" === e.charAt(0) ? -1 : 1) * parseFloat(e.substr(2)) + o), h && 1 === o && "hidden" === Q(t, "visibility", r) && 0 !== e && (o = 0), z ? n = new pe(l, "opacity", o, e - o, n) : (n = new pe(l, "opacity", 100 * o, 100 * (e - o), n), n.xn1 = h ? 1 : 0, l.zoom = 1, n.type = 2, n.b = "alpha(opacity=" + n.s + ")", n.e = "alpha(opacity=" + (n.s + n.c) + ")", n.data = t, n.plugin = a, n.setRatio = ke), h && (n = new pe(l, "visibility", 0, 0, n, -1, null, !1, 0, 0 !== o ? "inherit" : "hidden", 0 === e ? "hidden" : "inherit"), n.xs0 = "inherit", s._overwriteProps.push(n.n), s._overwriteProps.push(i)), n
        }});
        var Ce = function (t, e) {
            e && (t.removeProperty ? t.removeProperty(e.replace(P, "-$1").toLowerCase()) : t.removeAttribute(e))
        }, Ae = function (t) {
            if (this.t._gsClassPT = this, 1 === t || 0 === t) {
                this.t.className = 0 === t ? this.b : this.e;
                for (var e = this.data, i = this.t.style; e;)e.v ? i[e.p] = e.v : Ce(i, e.p), e = e._next;
                1 === t && this.t._gsClassPT === this && (this.t._gsClassPT = null)
            } else this.t.className !== this.e && (this.t.className = this.e)
        };
        me("className", {parser: function (t, e, s, n, a, o, l) {
            var h, u, _, p, f, c = t.className, d = t.style.cssText;
            if (a = n._classNamePT = new pe(t, s, 0, 0, a, 2), a.setRatio = Ae, a.pr = -11, i = !0, a.b = c, u = $(t, r), _ = t._gsClassPT) {
                for (p = {}, f = _.data; f;)p[f.p] = 1, f = f._next;
                _.setRatio(1)
            }
            return t._gsClassPT = a, a.e = "=" !== e.charAt(1) ? e : c.replace(RegExp("\\s*\\b" + e.substr(2) + "\\b"), "") + ("+" === e.charAt(0) ? " " + e.substr(2) : ""), n._tween._duration && (t.className = a.e, h = G(t, u, $(t), l, p), t.className = c, a.data = h.firstMPT, t.style.cssText = d, a = a.xfirst = n.parse(t, h.difs, a, o)), a
        }});
        var Oe = function (t) {
            if ((1 === t || 0 === t) && this.data._totalTime === this.data._totalDuration && "isFromStart" !== this.data.data) {
                var e, i, s, r, n = this.t.style, a = o.transform.parse;
                if ("all" === this.e)n.cssText = "", r = !0; else for (e = this.e.split(","), s = e.length; --s > -1;)i = e[s], o[i] && (o[i].parse === a ? r = !0 : i = "transformOrigin" === i ? xe : o[i].p), Ce(n, i);
                r && (Ce(n, ye), this.t._gsTransform && delete this.t._gsTransform)
            }
        };
        for (me("clearProps", {parser: function (t, e, s, r, n) {
            return n = new pe(t, s, 0, 0, n, 2), n.setRatio = Oe, n.e = e, n.pr = -10, n.data = r._tween, i = !0, n
        }}), l = "bezier,throwProps,physicsProps,physics2D".split(","), ce = l.length; ce--;)ge(l[ce]);
        l = a.prototype, l._firstPT = null, l._onInitTween = function (t, e, o) {
            if (!t.nodeType)return!1;
            this._target = t, this._tween = o, this._vars = e, h = e.autoRound, i = !1, s = e.suffixMap || a.suffixMap, r = W(t, ""), n = this._overwriteProps;
            var l, p, c, d, m, g, v, y, T, w = t.style;
            if (u && "" === w.zIndex && (l = Q(t, "zIndex", r), ("auto" === l || "" === l) && (w.zIndex = 0)), "string" == typeof e && (d = w.cssText, l = $(t, r), w.cssText = d + ";" + e, l = G(t, l, $(t)).difs, !z && x.test(e) && (l.opacity = parseFloat(RegExp.$1)), e = l, w.cssText = d), this._firstPT = p = this.parse(t, e, null), this._transformType) {
                for (T = 3 === this._transformType, ye ? _ && (u = !0, "" === w.zIndex && (v = Q(t, "zIndex", r), ("auto" === v || "" === v) && (w.zIndex = 0)), f && (w.WebkitBackfaceVisibility = this._vars.WebkitBackfaceVisibility || (T ? "visible" : "hidden"))) : w.zoom = 1, c = p; c && c._next;)c = c._next;
                y = new pe(t, "transform", 0, 0, null, 2), this._linkCSSP(y, null, c), y.setRatio = T && we ? Se : ye ? Re : Pe, y.data = this._transform || be(t, r, !0), n.pop()
            }
            if (i) {
                for (; p;) {
                    for (g = p._next, c = d; c && c.pr > p.pr;)c = c._next;
                    (p._prev = c ? c._prev : m) ? p._prev._next = p : d = p, (p._next = c) ? c._prev = p : m = p, p = g
                }
                this._firstPT = d
            }
            return!0
        }, l.parse = function (t, e, i, n) {
            var a, l, u, _, p, f, c, d, m, g, v = t.style;
            for (a in e)f = e[a], l = o[a], l ? i = l.parse(t, f, a, this, i, n, e) : (p = Q(t, a, r) + "", m = "string" == typeof f, "color" === a || "fill" === a || "stroke" === a || -1 !== a.indexOf("Color") || m && b.test(f) ? (m || (f = oe(f), f = (f.length > 3 ? "rgba(" : "rgb(") + f.join(",") + ")"), i = fe(v, a, p, f, !0, "transparent", i, 0, n)) : !m || -1 === f.indexOf(" ") && -1 === f.indexOf(",") ? (u = parseFloat(p), c = u || 0 === u ? p.substr((u + "").length) : "", ("" === p || "auto" === p) && ("width" === a || "height" === a ? (u = te(t, a, r), c = "px") : "left" === a || "top" === a ? (u = H(t, a, r), c = "px") : (u = "opacity" !== a ? 0 : 1, c = "")), g = m && "=" === f.charAt(1), g ? (_ = parseInt(f.charAt(0) + "1", 10), f = f.substr(2), _ *= parseFloat(f), d = f.replace(y, "")) : (_ = parseFloat(f), d = m ? f.substr((_ + "").length) || "" : ""), "" === d && (d = s[a] || c), f = _ || 0 === _ ? (g ? _ + u : _) + d : e[a], c !== d && "" !== d && (_ || 0 === _) && (u || 0 === u) && (u = Z(t, a, u, c), "%" === d ? (u /= Z(t, a, 100, "%") / 100, u > 100 && (u = 100), e.strictUnits !== !0 && (p = u + "%")) : "em" === d ? u /= Z(t, a, 1, "em") : (_ = Z(t, a, _, d), d = "px"), g && (_ || 0 === _) && (f = _ + u + d)), g && (_ += u), !u && 0 !== u || !_ && 0 !== _ ? void 0 !== v[a] && (f || "NaN" != f + "" && null != f) ? (i = new pe(v, a, _ || u || 0, 0, i, -1, a, !1, 0, p, f), i.xs0 = "none" !== f || "display" !== a && -1 === a.indexOf("Style") ? f : p) : B("invalid " + a + " tween value: " + e[a]) : (i = new pe(v, a, u, _ - u, i, 0, a, h !== !1 && ("px" === d || "zIndex" === a), 0, p, f), i.xs0 = d)) : i = fe(v, a, p, f, !0, null, i, 0, n)), n && i && !i.plugin && (i.plugin = n);
            return i
        }, l.setRatio = function (t) {
            var e, i, s, r = this._firstPT, n = 1e-6;
            if (1 !== t || this._tween._time !== this._tween._duration && 0 !== this._tween._time)if (t || this._tween._time !== this._tween._duration && 0 !== this._tween._time || this._tween._rawPrevTime === -1e-6)for (; r;) {
                if (e = r.c * t + r.s, r.r ? e = e > 0 ? 0 | e + .5 : 0 | e - .5 : n > e && e > -n && (e = 0), r.type)if (1 === r.type)if (s = r.l, 2 === s)r.t[r.p] = r.xs0 + e + r.xs1 + r.xn1 + r.xs2; else if (3 === s)r.t[r.p] = r.xs0 + e + r.xs1 + r.xn1 + r.xs2 + r.xn2 + r.xs3; else if (4 === s)r.t[r.p] = r.xs0 + e + r.xs1 + r.xn1 + r.xs2 + r.xn2 + r.xs3 + r.xn3 + r.xs4; else if (5 === s)r.t[r.p] = r.xs0 + e + r.xs1 + r.xn1 + r.xs2 + r.xn2 + r.xs3 + r.xn3 + r.xs4 + r.xn4 + r.xs5; else {
                    for (i = r.xs0 + e + r.xs1, s = 1; r.l > s; s++)i += r["xn" + s] + r["xs" + (s + 1)];
                    r.t[r.p] = i
                } else-1 === r.type ? r.t[r.p] = r.xs0 : r.setRatio && r.setRatio(t); else r.t[r.p] = e + r.xs0;
                r = r._next
            } else for (; r;)2 !== r.type ? r.t[r.p] = r.b : r.setRatio(t), r = r._next; else for (; r;)2 !== r.type ? r.t[r.p] = r.e : r.setRatio(t), r = r._next
        }, l._enableTransforms = function (t) {
            this._transformType = t || 3 === this._transformType ? 3 : 2, this._transform = this._transform || be(this._target, r, !0)
        }, l._linkCSSP = function (t, e, i, s) {
            return t && (e && (e._prev = t), t._next && (t._next._prev = t._prev), t._prev ? t._prev._next = t._next : this._firstPT === t && (this._firstPT = t._next, s = !0), i ? i._next = t : s || null !== this._firstPT || (this._firstPT = t), t._next = e, t._prev = i), t
        }, l._kill = function (e) {
            var i, s, r, n = e;
            if (e.autoAlpha || e.alpha) {
                n = {};
                for (s in e)n[s] = e[s];
                n.opacity = 1, n.autoAlpha && (n.visibility = 1)
            }
            return e.className && (i = this._classNamePT) && (r = i.xfirst, r && r._prev ? this._linkCSSP(r._prev, i._next, r._prev._prev) : r === this._firstPT && (this._firstPT = i._next), i._next && this._linkCSSP(i._next, i._next._next, r._prev), this._classNamePT = null), t.prototype._kill.call(this, n)
        };
        var De = function (t, e, i) {
            var s, r, n, a;
            if (t.slice)for (r = t.length; --r > -1;)De(t[r], e, i); else for (s = t.childNodes, r = s.length; --r > -1;)n = s[r], a = n.type, n.style && (e.push($(n)), i && i.push(n)), 1 !== a && 9 !== a && 11 !== a || !n.childNodes.length || De(n, e, i)
        };
        return a.cascadeTo = function (t, i, s) {
            var r, n, a, o = e.to(t, i, s), l = [o], h = [], u = [], _ = [], p = e._internals.reservedProps;
            for (t = o._targets || o.target, De(t, h, _), o.render(i, !0), De(t, u), o.render(0, !0), o._enabled(!0), r = _.length; --r > -1;)if (n = G(_[r], h[r], u[r]), n.firstMPT) {
                n = n.difs;
                for (a in s)p[a] && (n[a] = s[a]);
                l.push(e.to(_[r], i, n))
            }
            return l
        }, t.activate([a]), a
    }, !0)
}), window._gsDefine && window._gsQueue.pop()();
},{}],23:[function(require,module,exports){
/*!
 * VERSION: beta 1.7.1
 * DATE: 2013-10-23
 * UPDATES AND DOCS AT: http://www.greensock.com
 *
 * @license Copyright (c) 2008-2013, GreenSock. All rights reserved.
 * This work is subject to the terms at http://www.greensock.com/terms_of_use.html or for
 * Club GreenSock members, the software agreement that was issued with your membership.
 * 
 * @author: Jack Doyle, jack@greensock.com
 **/
(window._gsQueue || (window._gsQueue = [])).push(function () {
    "use strict";
    var t = document.documentElement, e = window, i = function (i, s) {
        var r = "x" === s ? "Width" : "Height", n = "scroll" + r, a = "client" + r, o = document.body;
        return i === e || i === t || i === o ? Math.max(t[n], o[n]) - (e["inner" + r] || Math.max(t[a], o[a])) : i[n] - i["offset" + r]
    }, s = window._gsDefine.plugin({propName: "scrollTo", API: 2, init: function (t, s, r) {
        return this._wdw = t === e, this._target = t, this._tween = r, "object" != typeof s && (s = {y: s}), this._autoKill = s.autoKill !== !1, this.x = this.xPrev = this.getX(), this.y = this.yPrev = this.getY(), null != s.x ? this._addTween(this, "x", this.x, "max" === s.x ? i(t, "x") : s.x, "scrollTo_x", !0) : this.skipX = !0, null != s.y ? this._addTween(this, "y", this.y, "max" === s.y ? i(t, "y") : s.y, "scrollTo_y", !0) : this.skipY = !0, !0
    }, set: function (t) {
        this._super.setRatio.call(this, t);
        var i = this._wdw || !this.skipX ? this.getX() : this.xPrev, s = this._wdw || !this.skipY ? this.getY() : this.yPrev, r = s - this.yPrev, n = i - this.xPrev;
        this._autoKill && (!this.skipX && (n > 7 || -7 > n) && (this.skipX = !0), !this.skipY && (r > 7 || -7 > r) && (this.skipY = !0), this.skipX && this.skipY && this._tween.kill()), this._wdw ? e.scrollTo(this.skipX ? i : this.x, this.skipY ? s : this.y) : (this.skipY || (this._target.scrollTop = this.y), this.skipX || (this._target.scrollLeft = this.x)), this.xPrev = this.x, this.yPrev = this.y
    }}), r = s.prototype;
    s.max = i, r.getX = function () {
        return this._wdw ? null != e.pageXOffset ? e.pageXOffset : null != t.scrollLeft ? t.scrollLeft : document.body.scrollLeft : this._target.scrollLeft
    }, r.getY = function () {
        return this._wdw ? null != e.pageYOffset ? e.pageYOffset : null != t.scrollTop ? t.scrollTop : document.body.scrollTop : this._target.scrollTop
    }, r._kill = function (t) {
        return t.scrollTo_x && (this.skipX = !0), t.scrollTo_y && (this.skipY = !0), this._super._kill.call(this, t)
    }
}), window._gsDefine && window._gsQueue.pop()();
},{}]},{},[2])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvdW5kZXJzY29yZS91bmRlcnNjb3JlLmpzIiwic2NyaXB0L291dC92ZW5kb3JfdWkuanMiLCJzY3JpcHQvdWkvYWNjb3JkaW9uLmpzIiwic2NyaXB0L3VpL2RpYWxvZy5qcyIsInNjcmlwdC91aS9maWxtc3RyaXAuanMiLCJzY3JpcHQvdWkvaGVscGVycy5qcyIsInNjcmlwdC91aS9pbWFnZVNpemUuanMiLCJzY3JpcHQvdWkvbG9hZGVyLmpzIiwic2NyaXB0L3VpL21ldHJpY3MuanMiLCJzY3JpcHQvdWkvbW91c2UuanMiLCJzY3JpcHQvdWkvc2Nyb2xsYWJsZUZpbG1zdHJpcC5qcyIsInNjcmlwdC91aS9zZWxlY3QuanMiLCJzY3JpcHQvdWkvc2l0ZVNjcm9sbC5qcyIsInNjcmlwdC91aS9zbGlkZXIuanMiLCJzY3JpcHQvdWkvdGFicy5qcyIsInNjcmlwdC91dGlscy9wYXJzZURhdGEuanMiLCJzY3JpcHQvdmVuZG9yL2hhbW1lci5qcyIsInNjcmlwdC92ZW5kb3IvdHdlZW5tYXguanMiLCJzY3JpcHQvdmVuZG9yL3R3ZWVubWF4My9UaW1lbGluZUxpdGUubWluLmpzIiwic2NyaXB0L3ZlbmRvci90d2Vlbm1heDMvVHdlZW5MaXRlLm1pbi5qcyIsInNjcmlwdC92ZW5kb3IvdHdlZW5tYXgzL2Vhc2luZy9FYXNlUGFjay5taW4uanMiLCJzY3JpcHQvdmVuZG9yL3R3ZWVubWF4My9wbHVnaW5zL0NTU1BsdWdpbi5taW4uanMiLCJzY3JpcHQvdmVuZG9yL3R3ZWVubWF4My9wbHVnaW5zL1Njcm9sbFRvUGx1Z2luLm1pbi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVnREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdktBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pPQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDclpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoUkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZNQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pRQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsbkVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pZQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeFZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8vICAgICBVbmRlcnNjb3JlLmpzIDEuOC4zXG4vLyAgICAgaHR0cDovL3VuZGVyc2NvcmVqcy5vcmdcbi8vICAgICAoYykgMjAwOS0yMDE1IEplcmVteSBBc2hrZW5hcywgRG9jdW1lbnRDbG91ZCBhbmQgSW52ZXN0aWdhdGl2ZSBSZXBvcnRlcnMgJiBFZGl0b3JzXG4vLyAgICAgVW5kZXJzY29yZSBtYXkgYmUgZnJlZWx5IGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBNSVQgbGljZW5zZS5cblxuKGZ1bmN0aW9uKCkge1xuXG4gIC8vIEJhc2VsaW5lIHNldHVwXG4gIC8vIC0tLS0tLS0tLS0tLS0tXG5cbiAgLy8gRXN0YWJsaXNoIHRoZSByb290IG9iamVjdCwgYHdpbmRvd2AgaW4gdGhlIGJyb3dzZXIsIG9yIGBleHBvcnRzYCBvbiB0aGUgc2VydmVyLlxuICB2YXIgcm9vdCA9IHRoaXM7XG5cbiAgLy8gU2F2ZSB0aGUgcHJldmlvdXMgdmFsdWUgb2YgdGhlIGBfYCB2YXJpYWJsZS5cbiAgdmFyIHByZXZpb3VzVW5kZXJzY29yZSA9IHJvb3QuXztcblxuICAvLyBTYXZlIGJ5dGVzIGluIHRoZSBtaW5pZmllZCAoYnV0IG5vdCBnemlwcGVkKSB2ZXJzaW9uOlxuICB2YXIgQXJyYXlQcm90byA9IEFycmF5LnByb3RvdHlwZSwgT2JqUHJvdG8gPSBPYmplY3QucHJvdG90eXBlLCBGdW5jUHJvdG8gPSBGdW5jdGlvbi5wcm90b3R5cGU7XG5cbiAgLy8gQ3JlYXRlIHF1aWNrIHJlZmVyZW5jZSB2YXJpYWJsZXMgZm9yIHNwZWVkIGFjY2VzcyB0byBjb3JlIHByb3RvdHlwZXMuXG4gIHZhclxuICAgIHB1c2ggICAgICAgICAgICAgPSBBcnJheVByb3RvLnB1c2gsXG4gICAgc2xpY2UgICAgICAgICAgICA9IEFycmF5UHJvdG8uc2xpY2UsXG4gICAgdG9TdHJpbmcgICAgICAgICA9IE9ialByb3RvLnRvU3RyaW5nLFxuICAgIGhhc093blByb3BlcnR5ICAgPSBPYmpQcm90by5oYXNPd25Qcm9wZXJ0eTtcblxuICAvLyBBbGwgKipFQ01BU2NyaXB0IDUqKiBuYXRpdmUgZnVuY3Rpb24gaW1wbGVtZW50YXRpb25zIHRoYXQgd2UgaG9wZSB0byB1c2VcbiAgLy8gYXJlIGRlY2xhcmVkIGhlcmUuXG4gIHZhclxuICAgIG5hdGl2ZUlzQXJyYXkgICAgICA9IEFycmF5LmlzQXJyYXksXG4gICAgbmF0aXZlS2V5cyAgICAgICAgID0gT2JqZWN0LmtleXMsXG4gICAgbmF0aXZlQmluZCAgICAgICAgID0gRnVuY1Byb3RvLmJpbmQsXG4gICAgbmF0aXZlQ3JlYXRlICAgICAgID0gT2JqZWN0LmNyZWF0ZTtcblxuICAvLyBOYWtlZCBmdW5jdGlvbiByZWZlcmVuY2UgZm9yIHN1cnJvZ2F0ZS1wcm90b3R5cGUtc3dhcHBpbmcuXG4gIHZhciBDdG9yID0gZnVuY3Rpb24oKXt9O1xuXG4gIC8vIENyZWF0ZSBhIHNhZmUgcmVmZXJlbmNlIHRvIHRoZSBVbmRlcnNjb3JlIG9iamVjdCBmb3IgdXNlIGJlbG93LlxuICB2YXIgXyA9IGZ1bmN0aW9uKG9iaikge1xuICAgIGlmIChvYmogaW5zdGFuY2VvZiBfKSByZXR1cm4gb2JqO1xuICAgIGlmICghKHRoaXMgaW5zdGFuY2VvZiBfKSkgcmV0dXJuIG5ldyBfKG9iaik7XG4gICAgdGhpcy5fd3JhcHBlZCA9IG9iajtcbiAgfTtcblxuICAvLyBFeHBvcnQgdGhlIFVuZGVyc2NvcmUgb2JqZWN0IGZvciAqKk5vZGUuanMqKiwgd2l0aFxuICAvLyBiYWNrd2FyZHMtY29tcGF0aWJpbGl0eSBmb3IgdGhlIG9sZCBgcmVxdWlyZSgpYCBBUEkuIElmIHdlJ3JlIGluXG4gIC8vIHRoZSBicm93c2VyLCBhZGQgYF9gIGFzIGEgZ2xvYmFsIG9iamVjdC5cbiAgaWYgKHR5cGVvZiBleHBvcnRzICE9PSAndW5kZWZpbmVkJykge1xuICAgIGlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cykge1xuICAgICAgZXhwb3J0cyA9IG1vZHVsZS5leHBvcnRzID0gXztcbiAgICB9XG4gICAgZXhwb3J0cy5fID0gXztcbiAgfSBlbHNlIHtcbiAgICByb290Ll8gPSBfO1xuICB9XG5cbiAgLy8gQ3VycmVudCB2ZXJzaW9uLlxuICBfLlZFUlNJT04gPSAnMS44LjMnO1xuXG4gIC8vIEludGVybmFsIGZ1bmN0aW9uIHRoYXQgcmV0dXJucyBhbiBlZmZpY2llbnQgKGZvciBjdXJyZW50IGVuZ2luZXMpIHZlcnNpb25cbiAgLy8gb2YgdGhlIHBhc3NlZC1pbiBjYWxsYmFjaywgdG8gYmUgcmVwZWF0ZWRseSBhcHBsaWVkIGluIG90aGVyIFVuZGVyc2NvcmVcbiAgLy8gZnVuY3Rpb25zLlxuICB2YXIgb3B0aW1pemVDYiA9IGZ1bmN0aW9uKGZ1bmMsIGNvbnRleHQsIGFyZ0NvdW50KSB7XG4gICAgaWYgKGNvbnRleHQgPT09IHZvaWQgMCkgcmV0dXJuIGZ1bmM7XG4gICAgc3dpdGNoIChhcmdDb3VudCA9PSBudWxsID8gMyA6IGFyZ0NvdW50KSB7XG4gICAgICBjYXNlIDE6IHJldHVybiBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICByZXR1cm4gZnVuYy5jYWxsKGNvbnRleHQsIHZhbHVlKTtcbiAgICAgIH07XG4gICAgICBjYXNlIDI6IHJldHVybiBmdW5jdGlvbih2YWx1ZSwgb3RoZXIpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmMuY2FsbChjb250ZXh0LCB2YWx1ZSwgb3RoZXIpO1xuICAgICAgfTtcbiAgICAgIGNhc2UgMzogcmV0dXJuIGZ1bmN0aW9uKHZhbHVlLCBpbmRleCwgY29sbGVjdGlvbikge1xuICAgICAgICByZXR1cm4gZnVuYy5jYWxsKGNvbnRleHQsIHZhbHVlLCBpbmRleCwgY29sbGVjdGlvbik7XG4gICAgICB9O1xuICAgICAgY2FzZSA0OiByZXR1cm4gZnVuY3Rpb24oYWNjdW11bGF0b3IsIHZhbHVlLCBpbmRleCwgY29sbGVjdGlvbikge1xuICAgICAgICByZXR1cm4gZnVuYy5jYWxsKGNvbnRleHQsIGFjY3VtdWxhdG9yLCB2YWx1ZSwgaW5kZXgsIGNvbGxlY3Rpb24pO1xuICAgICAgfTtcbiAgICB9XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIGZ1bmMuYXBwbHkoY29udGV4dCwgYXJndW1lbnRzKTtcbiAgICB9O1xuICB9O1xuXG4gIC8vIEEgbW9zdGx5LWludGVybmFsIGZ1bmN0aW9uIHRvIGdlbmVyYXRlIGNhbGxiYWNrcyB0aGF0IGNhbiBiZSBhcHBsaWVkXG4gIC8vIHRvIGVhY2ggZWxlbWVudCBpbiBhIGNvbGxlY3Rpb24sIHJldHVybmluZyB0aGUgZGVzaXJlZCByZXN1bHQg4oCUIGVpdGhlclxuICAvLyBpZGVudGl0eSwgYW4gYXJiaXRyYXJ5IGNhbGxiYWNrLCBhIHByb3BlcnR5IG1hdGNoZXIsIG9yIGEgcHJvcGVydHkgYWNjZXNzb3IuXG4gIHZhciBjYiA9IGZ1bmN0aW9uKHZhbHVlLCBjb250ZXh0LCBhcmdDb3VudCkge1xuICAgIGlmICh2YWx1ZSA9PSBudWxsKSByZXR1cm4gXy5pZGVudGl0eTtcbiAgICBpZiAoXy5pc0Z1bmN0aW9uKHZhbHVlKSkgcmV0dXJuIG9wdGltaXplQ2IodmFsdWUsIGNvbnRleHQsIGFyZ0NvdW50KTtcbiAgICBpZiAoXy5pc09iamVjdCh2YWx1ZSkpIHJldHVybiBfLm1hdGNoZXIodmFsdWUpO1xuICAgIHJldHVybiBfLnByb3BlcnR5KHZhbHVlKTtcbiAgfTtcbiAgXy5pdGVyYXRlZSA9IGZ1bmN0aW9uKHZhbHVlLCBjb250ZXh0KSB7XG4gICAgcmV0dXJuIGNiKHZhbHVlLCBjb250ZXh0LCBJbmZpbml0eSk7XG4gIH07XG5cbiAgLy8gQW4gaW50ZXJuYWwgZnVuY3Rpb24gZm9yIGNyZWF0aW5nIGFzc2lnbmVyIGZ1bmN0aW9ucy5cbiAgdmFyIGNyZWF0ZUFzc2lnbmVyID0gZnVuY3Rpb24oa2V5c0Z1bmMsIHVuZGVmaW5lZE9ubHkpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24ob2JqKSB7XG4gICAgICB2YXIgbGVuZ3RoID0gYXJndW1lbnRzLmxlbmd0aDtcbiAgICAgIGlmIChsZW5ndGggPCAyIHx8IG9iaiA9PSBudWxsKSByZXR1cm4gb2JqO1xuICAgICAgZm9yICh2YXIgaW5kZXggPSAxOyBpbmRleCA8IGxlbmd0aDsgaW5kZXgrKykge1xuICAgICAgICB2YXIgc291cmNlID0gYXJndW1lbnRzW2luZGV4XSxcbiAgICAgICAgICAgIGtleXMgPSBrZXlzRnVuYyhzb3VyY2UpLFxuICAgICAgICAgICAgbCA9IGtleXMubGVuZ3RoO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGw7IGkrKykge1xuICAgICAgICAgIHZhciBrZXkgPSBrZXlzW2ldO1xuICAgICAgICAgIGlmICghdW5kZWZpbmVkT25seSB8fCBvYmpba2V5XSA9PT0gdm9pZCAwKSBvYmpba2V5XSA9IHNvdXJjZVtrZXldO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gb2JqO1xuICAgIH07XG4gIH07XG5cbiAgLy8gQW4gaW50ZXJuYWwgZnVuY3Rpb24gZm9yIGNyZWF0aW5nIGEgbmV3IG9iamVjdCB0aGF0IGluaGVyaXRzIGZyb20gYW5vdGhlci5cbiAgdmFyIGJhc2VDcmVhdGUgPSBmdW5jdGlvbihwcm90b3R5cGUpIHtcbiAgICBpZiAoIV8uaXNPYmplY3QocHJvdG90eXBlKSkgcmV0dXJuIHt9O1xuICAgIGlmIChuYXRpdmVDcmVhdGUpIHJldHVybiBuYXRpdmVDcmVhdGUocHJvdG90eXBlKTtcbiAgICBDdG9yLnByb3RvdHlwZSA9IHByb3RvdHlwZTtcbiAgICB2YXIgcmVzdWx0ID0gbmV3IEN0b3I7XG4gICAgQ3Rvci5wcm90b3R5cGUgPSBudWxsO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH07XG5cbiAgdmFyIHByb3BlcnR5ID0gZnVuY3Rpb24oa2V5KSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKG9iaikge1xuICAgICAgcmV0dXJuIG9iaiA9PSBudWxsID8gdm9pZCAwIDogb2JqW2tleV07XG4gICAgfTtcbiAgfTtcblxuICAvLyBIZWxwZXIgZm9yIGNvbGxlY3Rpb24gbWV0aG9kcyB0byBkZXRlcm1pbmUgd2hldGhlciBhIGNvbGxlY3Rpb25cbiAgLy8gc2hvdWxkIGJlIGl0ZXJhdGVkIGFzIGFuIGFycmF5IG9yIGFzIGFuIG9iamVjdFxuICAvLyBSZWxhdGVkOiBodHRwOi8vcGVvcGxlLm1vemlsbGEub3JnL35qb3JlbmRvcmZmL2VzNi1kcmFmdC5odG1sI3NlYy10b2xlbmd0aFxuICAvLyBBdm9pZHMgYSB2ZXJ5IG5hc3R5IGlPUyA4IEpJVCBidWcgb24gQVJNLTY0LiAjMjA5NFxuICB2YXIgTUFYX0FSUkFZX0lOREVYID0gTWF0aC5wb3coMiwgNTMpIC0gMTtcbiAgdmFyIGdldExlbmd0aCA9IHByb3BlcnR5KCdsZW5ndGgnKTtcbiAgdmFyIGlzQXJyYXlMaWtlID0gZnVuY3Rpb24oY29sbGVjdGlvbikge1xuICAgIHZhciBsZW5ndGggPSBnZXRMZW5ndGgoY29sbGVjdGlvbik7XG4gICAgcmV0dXJuIHR5cGVvZiBsZW5ndGggPT0gJ251bWJlcicgJiYgbGVuZ3RoID49IDAgJiYgbGVuZ3RoIDw9IE1BWF9BUlJBWV9JTkRFWDtcbiAgfTtcblxuICAvLyBDb2xsZWN0aW9uIEZ1bmN0aW9uc1xuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8vIFRoZSBjb3JuZXJzdG9uZSwgYW4gYGVhY2hgIGltcGxlbWVudGF0aW9uLCBha2EgYGZvckVhY2hgLlxuICAvLyBIYW5kbGVzIHJhdyBvYmplY3RzIGluIGFkZGl0aW9uIHRvIGFycmF5LWxpa2VzLiBUcmVhdHMgYWxsXG4gIC8vIHNwYXJzZSBhcnJheS1saWtlcyBhcyBpZiB0aGV5IHdlcmUgZGVuc2UuXG4gIF8uZWFjaCA9IF8uZm9yRWFjaCA9IGZ1bmN0aW9uKG9iaiwgaXRlcmF0ZWUsIGNvbnRleHQpIHtcbiAgICBpdGVyYXRlZSA9IG9wdGltaXplQ2IoaXRlcmF0ZWUsIGNvbnRleHQpO1xuICAgIHZhciBpLCBsZW5ndGg7XG4gICAgaWYgKGlzQXJyYXlMaWtlKG9iaikpIHtcbiAgICAgIGZvciAoaSA9IDAsIGxlbmd0aCA9IG9iai5sZW5ndGg7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgICBpdGVyYXRlZShvYmpbaV0sIGksIG9iaik7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciBrZXlzID0gXy5rZXlzKG9iaik7XG4gICAgICBmb3IgKGkgPSAwLCBsZW5ndGggPSBrZXlzLmxlbmd0aDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGl0ZXJhdGVlKG9ialtrZXlzW2ldXSwga2V5c1tpXSwgb2JqKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG9iajtcbiAgfTtcblxuICAvLyBSZXR1cm4gdGhlIHJlc3VsdHMgb2YgYXBwbHlpbmcgdGhlIGl0ZXJhdGVlIHRvIGVhY2ggZWxlbWVudC5cbiAgXy5tYXAgPSBfLmNvbGxlY3QgPSBmdW5jdGlvbihvYmosIGl0ZXJhdGVlLCBjb250ZXh0KSB7XG4gICAgaXRlcmF0ZWUgPSBjYihpdGVyYXRlZSwgY29udGV4dCk7XG4gICAgdmFyIGtleXMgPSAhaXNBcnJheUxpa2Uob2JqKSAmJiBfLmtleXMob2JqKSxcbiAgICAgICAgbGVuZ3RoID0gKGtleXMgfHwgb2JqKS5sZW5ndGgsXG4gICAgICAgIHJlc3VsdHMgPSBBcnJheShsZW5ndGgpO1xuICAgIGZvciAodmFyIGluZGV4ID0gMDsgaW5kZXggPCBsZW5ndGg7IGluZGV4KyspIHtcbiAgICAgIHZhciBjdXJyZW50S2V5ID0ga2V5cyA/IGtleXNbaW5kZXhdIDogaW5kZXg7XG4gICAgICByZXN1bHRzW2luZGV4XSA9IGl0ZXJhdGVlKG9ialtjdXJyZW50S2V5XSwgY3VycmVudEtleSwgb2JqKTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdHM7XG4gIH07XG5cbiAgLy8gQ3JlYXRlIGEgcmVkdWNpbmcgZnVuY3Rpb24gaXRlcmF0aW5nIGxlZnQgb3IgcmlnaHQuXG4gIGZ1bmN0aW9uIGNyZWF0ZVJlZHVjZShkaXIpIHtcbiAgICAvLyBPcHRpbWl6ZWQgaXRlcmF0b3IgZnVuY3Rpb24gYXMgdXNpbmcgYXJndW1lbnRzLmxlbmd0aFxuICAgIC8vIGluIHRoZSBtYWluIGZ1bmN0aW9uIHdpbGwgZGVvcHRpbWl6ZSB0aGUsIHNlZSAjMTk5MS5cbiAgICBmdW5jdGlvbiBpdGVyYXRvcihvYmosIGl0ZXJhdGVlLCBtZW1vLCBrZXlzLCBpbmRleCwgbGVuZ3RoKSB7XG4gICAgICBmb3IgKDsgaW5kZXggPj0gMCAmJiBpbmRleCA8IGxlbmd0aDsgaW5kZXggKz0gZGlyKSB7XG4gICAgICAgIHZhciBjdXJyZW50S2V5ID0ga2V5cyA/IGtleXNbaW5kZXhdIDogaW5kZXg7XG4gICAgICAgIG1lbW8gPSBpdGVyYXRlZShtZW1vLCBvYmpbY3VycmVudEtleV0sIGN1cnJlbnRLZXksIG9iaik7XG4gICAgICB9XG4gICAgICByZXR1cm4gbWVtbztcbiAgICB9XG5cbiAgICByZXR1cm4gZnVuY3Rpb24ob2JqLCBpdGVyYXRlZSwgbWVtbywgY29udGV4dCkge1xuICAgICAgaXRlcmF0ZWUgPSBvcHRpbWl6ZUNiKGl0ZXJhdGVlLCBjb250ZXh0LCA0KTtcbiAgICAgIHZhciBrZXlzID0gIWlzQXJyYXlMaWtlKG9iaikgJiYgXy5rZXlzKG9iaiksXG4gICAgICAgICAgbGVuZ3RoID0gKGtleXMgfHwgb2JqKS5sZW5ndGgsXG4gICAgICAgICAgaW5kZXggPSBkaXIgPiAwID8gMCA6IGxlbmd0aCAtIDE7XG4gICAgICAvLyBEZXRlcm1pbmUgdGhlIGluaXRpYWwgdmFsdWUgaWYgbm9uZSBpcyBwcm92aWRlZC5cbiAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoIDwgMykge1xuICAgICAgICBtZW1vID0gb2JqW2tleXMgPyBrZXlzW2luZGV4XSA6IGluZGV4XTtcbiAgICAgICAgaW5kZXggKz0gZGlyO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGl0ZXJhdG9yKG9iaiwgaXRlcmF0ZWUsIG1lbW8sIGtleXMsIGluZGV4LCBsZW5ndGgpO1xuICAgIH07XG4gIH1cblxuICAvLyAqKlJlZHVjZSoqIGJ1aWxkcyB1cCBhIHNpbmdsZSByZXN1bHQgZnJvbSBhIGxpc3Qgb2YgdmFsdWVzLCBha2EgYGluamVjdGAsXG4gIC8vIG9yIGBmb2xkbGAuXG4gIF8ucmVkdWNlID0gXy5mb2xkbCA9IF8uaW5qZWN0ID0gY3JlYXRlUmVkdWNlKDEpO1xuXG4gIC8vIFRoZSByaWdodC1hc3NvY2lhdGl2ZSB2ZXJzaW9uIG9mIHJlZHVjZSwgYWxzbyBrbm93biBhcyBgZm9sZHJgLlxuICBfLnJlZHVjZVJpZ2h0ID0gXy5mb2xkciA9IGNyZWF0ZVJlZHVjZSgtMSk7XG5cbiAgLy8gUmV0dXJuIHRoZSBmaXJzdCB2YWx1ZSB3aGljaCBwYXNzZXMgYSB0cnV0aCB0ZXN0LiBBbGlhc2VkIGFzIGBkZXRlY3RgLlxuICBfLmZpbmQgPSBfLmRldGVjdCA9IGZ1bmN0aW9uKG9iaiwgcHJlZGljYXRlLCBjb250ZXh0KSB7XG4gICAgdmFyIGtleTtcbiAgICBpZiAoaXNBcnJheUxpa2Uob2JqKSkge1xuICAgICAga2V5ID0gXy5maW5kSW5kZXgob2JqLCBwcmVkaWNhdGUsIGNvbnRleHQpO1xuICAgIH0gZWxzZSB7XG4gICAgICBrZXkgPSBfLmZpbmRLZXkob2JqLCBwcmVkaWNhdGUsIGNvbnRleHQpO1xuICAgIH1cbiAgICBpZiAoa2V5ICE9PSB2b2lkIDAgJiYga2V5ICE9PSAtMSkgcmV0dXJuIG9ialtrZXldO1xuICB9O1xuXG4gIC8vIFJldHVybiBhbGwgdGhlIGVsZW1lbnRzIHRoYXQgcGFzcyBhIHRydXRoIHRlc3QuXG4gIC8vIEFsaWFzZWQgYXMgYHNlbGVjdGAuXG4gIF8uZmlsdGVyID0gXy5zZWxlY3QgPSBmdW5jdGlvbihvYmosIHByZWRpY2F0ZSwgY29udGV4dCkge1xuICAgIHZhciByZXN1bHRzID0gW107XG4gICAgcHJlZGljYXRlID0gY2IocHJlZGljYXRlLCBjb250ZXh0KTtcbiAgICBfLmVhY2gob2JqLCBmdW5jdGlvbih2YWx1ZSwgaW5kZXgsIGxpc3QpIHtcbiAgICAgIGlmIChwcmVkaWNhdGUodmFsdWUsIGluZGV4LCBsaXN0KSkgcmVzdWx0cy5wdXNoKHZhbHVlKTtcbiAgICB9KTtcbiAgICByZXR1cm4gcmVzdWx0cztcbiAgfTtcblxuICAvLyBSZXR1cm4gYWxsIHRoZSBlbGVtZW50cyBmb3Igd2hpY2ggYSB0cnV0aCB0ZXN0IGZhaWxzLlxuICBfLnJlamVjdCA9IGZ1bmN0aW9uKG9iaiwgcHJlZGljYXRlLCBjb250ZXh0KSB7XG4gICAgcmV0dXJuIF8uZmlsdGVyKG9iaiwgXy5uZWdhdGUoY2IocHJlZGljYXRlKSksIGNvbnRleHQpO1xuICB9O1xuXG4gIC8vIERldGVybWluZSB3aGV0aGVyIGFsbCBvZiB0aGUgZWxlbWVudHMgbWF0Y2ggYSB0cnV0aCB0ZXN0LlxuICAvLyBBbGlhc2VkIGFzIGBhbGxgLlxuICBfLmV2ZXJ5ID0gXy5hbGwgPSBmdW5jdGlvbihvYmosIHByZWRpY2F0ZSwgY29udGV4dCkge1xuICAgIHByZWRpY2F0ZSA9IGNiKHByZWRpY2F0ZSwgY29udGV4dCk7XG4gICAgdmFyIGtleXMgPSAhaXNBcnJheUxpa2Uob2JqKSAmJiBfLmtleXMob2JqKSxcbiAgICAgICAgbGVuZ3RoID0gKGtleXMgfHwgb2JqKS5sZW5ndGg7XG4gICAgZm9yICh2YXIgaW5kZXggPSAwOyBpbmRleCA8IGxlbmd0aDsgaW5kZXgrKykge1xuICAgICAgdmFyIGN1cnJlbnRLZXkgPSBrZXlzID8ga2V5c1tpbmRleF0gOiBpbmRleDtcbiAgICAgIGlmICghcHJlZGljYXRlKG9ialtjdXJyZW50S2V5XSwgY3VycmVudEtleSwgb2JqKSkgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfTtcblxuICAvLyBEZXRlcm1pbmUgaWYgYXQgbGVhc3Qgb25lIGVsZW1lbnQgaW4gdGhlIG9iamVjdCBtYXRjaGVzIGEgdHJ1dGggdGVzdC5cbiAgLy8gQWxpYXNlZCBhcyBgYW55YC5cbiAgXy5zb21lID0gXy5hbnkgPSBmdW5jdGlvbihvYmosIHByZWRpY2F0ZSwgY29udGV4dCkge1xuICAgIHByZWRpY2F0ZSA9IGNiKHByZWRpY2F0ZSwgY29udGV4dCk7XG4gICAgdmFyIGtleXMgPSAhaXNBcnJheUxpa2Uob2JqKSAmJiBfLmtleXMob2JqKSxcbiAgICAgICAgbGVuZ3RoID0gKGtleXMgfHwgb2JqKS5sZW5ndGg7XG4gICAgZm9yICh2YXIgaW5kZXggPSAwOyBpbmRleCA8IGxlbmd0aDsgaW5kZXgrKykge1xuICAgICAgdmFyIGN1cnJlbnRLZXkgPSBrZXlzID8ga2V5c1tpbmRleF0gOiBpbmRleDtcbiAgICAgIGlmIChwcmVkaWNhdGUob2JqW2N1cnJlbnRLZXldLCBjdXJyZW50S2V5LCBvYmopKSByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9O1xuXG4gIC8vIERldGVybWluZSBpZiB0aGUgYXJyYXkgb3Igb2JqZWN0IGNvbnRhaW5zIGEgZ2l2ZW4gaXRlbSAodXNpbmcgYD09PWApLlxuICAvLyBBbGlhc2VkIGFzIGBpbmNsdWRlc2AgYW5kIGBpbmNsdWRlYC5cbiAgXy5jb250YWlucyA9IF8uaW5jbHVkZXMgPSBfLmluY2x1ZGUgPSBmdW5jdGlvbihvYmosIGl0ZW0sIGZyb21JbmRleCwgZ3VhcmQpIHtcbiAgICBpZiAoIWlzQXJyYXlMaWtlKG9iaikpIG9iaiA9IF8udmFsdWVzKG9iaik7XG4gICAgaWYgKHR5cGVvZiBmcm9tSW5kZXggIT0gJ251bWJlcicgfHwgZ3VhcmQpIGZyb21JbmRleCA9IDA7XG4gICAgcmV0dXJuIF8uaW5kZXhPZihvYmosIGl0ZW0sIGZyb21JbmRleCkgPj0gMDtcbiAgfTtcblxuICAvLyBJbnZva2UgYSBtZXRob2QgKHdpdGggYXJndW1lbnRzKSBvbiBldmVyeSBpdGVtIGluIGEgY29sbGVjdGlvbi5cbiAgXy5pbnZva2UgPSBmdW5jdGlvbihvYmosIG1ldGhvZCkge1xuICAgIHZhciBhcmdzID0gc2xpY2UuY2FsbChhcmd1bWVudHMsIDIpO1xuICAgIHZhciBpc0Z1bmMgPSBfLmlzRnVuY3Rpb24obWV0aG9kKTtcbiAgICByZXR1cm4gXy5tYXAob2JqLCBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgdmFyIGZ1bmMgPSBpc0Z1bmMgPyBtZXRob2QgOiB2YWx1ZVttZXRob2RdO1xuICAgICAgcmV0dXJuIGZ1bmMgPT0gbnVsbCA/IGZ1bmMgOiBmdW5jLmFwcGx5KHZhbHVlLCBhcmdzKTtcbiAgICB9KTtcbiAgfTtcblxuICAvLyBDb252ZW5pZW5jZSB2ZXJzaW9uIG9mIGEgY29tbW9uIHVzZSBjYXNlIG9mIGBtYXBgOiBmZXRjaGluZyBhIHByb3BlcnR5LlxuICBfLnBsdWNrID0gZnVuY3Rpb24ob2JqLCBrZXkpIHtcbiAgICByZXR1cm4gXy5tYXAob2JqLCBfLnByb3BlcnR5KGtleSkpO1xuICB9O1xuXG4gIC8vIENvbnZlbmllbmNlIHZlcnNpb24gb2YgYSBjb21tb24gdXNlIGNhc2Ugb2YgYGZpbHRlcmA6IHNlbGVjdGluZyBvbmx5IG9iamVjdHNcbiAgLy8gY29udGFpbmluZyBzcGVjaWZpYyBga2V5OnZhbHVlYCBwYWlycy5cbiAgXy53aGVyZSA9IGZ1bmN0aW9uKG9iaiwgYXR0cnMpIHtcbiAgICByZXR1cm4gXy5maWx0ZXIob2JqLCBfLm1hdGNoZXIoYXR0cnMpKTtcbiAgfTtcblxuICAvLyBDb252ZW5pZW5jZSB2ZXJzaW9uIG9mIGEgY29tbW9uIHVzZSBjYXNlIG9mIGBmaW5kYDogZ2V0dGluZyB0aGUgZmlyc3Qgb2JqZWN0XG4gIC8vIGNvbnRhaW5pbmcgc3BlY2lmaWMgYGtleTp2YWx1ZWAgcGFpcnMuXG4gIF8uZmluZFdoZXJlID0gZnVuY3Rpb24ob2JqLCBhdHRycykge1xuICAgIHJldHVybiBfLmZpbmQob2JqLCBfLm1hdGNoZXIoYXR0cnMpKTtcbiAgfTtcblxuICAvLyBSZXR1cm4gdGhlIG1heGltdW0gZWxlbWVudCAob3IgZWxlbWVudC1iYXNlZCBjb21wdXRhdGlvbikuXG4gIF8ubWF4ID0gZnVuY3Rpb24ob2JqLCBpdGVyYXRlZSwgY29udGV4dCkge1xuICAgIHZhciByZXN1bHQgPSAtSW5maW5pdHksIGxhc3RDb21wdXRlZCA9IC1JbmZpbml0eSxcbiAgICAgICAgdmFsdWUsIGNvbXB1dGVkO1xuICAgIGlmIChpdGVyYXRlZSA9PSBudWxsICYmIG9iaiAhPSBudWxsKSB7XG4gICAgICBvYmogPSBpc0FycmF5TGlrZShvYmopID8gb2JqIDogXy52YWx1ZXMob2JqKTtcbiAgICAgIGZvciAodmFyIGkgPSAwLCBsZW5ndGggPSBvYmoubGVuZ3RoOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFsdWUgPSBvYmpbaV07XG4gICAgICAgIGlmICh2YWx1ZSA+IHJlc3VsdCkge1xuICAgICAgICAgIHJlc3VsdCA9IHZhbHVlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGl0ZXJhdGVlID0gY2IoaXRlcmF0ZWUsIGNvbnRleHQpO1xuICAgICAgXy5lYWNoKG9iaiwgZnVuY3Rpb24odmFsdWUsIGluZGV4LCBsaXN0KSB7XG4gICAgICAgIGNvbXB1dGVkID0gaXRlcmF0ZWUodmFsdWUsIGluZGV4LCBsaXN0KTtcbiAgICAgICAgaWYgKGNvbXB1dGVkID4gbGFzdENvbXB1dGVkIHx8IGNvbXB1dGVkID09PSAtSW5maW5pdHkgJiYgcmVzdWx0ID09PSAtSW5maW5pdHkpIHtcbiAgICAgICAgICByZXN1bHQgPSB2YWx1ZTtcbiAgICAgICAgICBsYXN0Q29tcHV0ZWQgPSBjb21wdXRlZDtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH07XG5cbiAgLy8gUmV0dXJuIHRoZSBtaW5pbXVtIGVsZW1lbnQgKG9yIGVsZW1lbnQtYmFzZWQgY29tcHV0YXRpb24pLlxuICBfLm1pbiA9IGZ1bmN0aW9uKG9iaiwgaXRlcmF0ZWUsIGNvbnRleHQpIHtcbiAgICB2YXIgcmVzdWx0ID0gSW5maW5pdHksIGxhc3RDb21wdXRlZCA9IEluZmluaXR5LFxuICAgICAgICB2YWx1ZSwgY29tcHV0ZWQ7XG4gICAgaWYgKGl0ZXJhdGVlID09IG51bGwgJiYgb2JqICE9IG51bGwpIHtcbiAgICAgIG9iaiA9IGlzQXJyYXlMaWtlKG9iaikgPyBvYmogOiBfLnZhbHVlcyhvYmopO1xuICAgICAgZm9yICh2YXIgaSA9IDAsIGxlbmd0aCA9IG9iai5sZW5ndGg7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgICB2YWx1ZSA9IG9ialtpXTtcbiAgICAgICAgaWYgKHZhbHVlIDwgcmVzdWx0KSB7XG4gICAgICAgICAgcmVzdWx0ID0gdmFsdWU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgaXRlcmF0ZWUgPSBjYihpdGVyYXRlZSwgY29udGV4dCk7XG4gICAgICBfLmVhY2gob2JqLCBmdW5jdGlvbih2YWx1ZSwgaW5kZXgsIGxpc3QpIHtcbiAgICAgICAgY29tcHV0ZWQgPSBpdGVyYXRlZSh2YWx1ZSwgaW5kZXgsIGxpc3QpO1xuICAgICAgICBpZiAoY29tcHV0ZWQgPCBsYXN0Q29tcHV0ZWQgfHwgY29tcHV0ZWQgPT09IEluZmluaXR5ICYmIHJlc3VsdCA9PT0gSW5maW5pdHkpIHtcbiAgICAgICAgICByZXN1bHQgPSB2YWx1ZTtcbiAgICAgICAgICBsYXN0Q29tcHV0ZWQgPSBjb21wdXRlZDtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH07XG5cbiAgLy8gU2h1ZmZsZSBhIGNvbGxlY3Rpb24sIHVzaW5nIHRoZSBtb2Rlcm4gdmVyc2lvbiBvZiB0aGVcbiAgLy8gW0Zpc2hlci1ZYXRlcyBzaHVmZmxlXShodHRwOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0Zpc2hlcuKAk1lhdGVzX3NodWZmbGUpLlxuICBfLnNodWZmbGUgPSBmdW5jdGlvbihvYmopIHtcbiAgICB2YXIgc2V0ID0gaXNBcnJheUxpa2Uob2JqKSA/IG9iaiA6IF8udmFsdWVzKG9iaik7XG4gICAgdmFyIGxlbmd0aCA9IHNldC5sZW5ndGg7XG4gICAgdmFyIHNodWZmbGVkID0gQXJyYXkobGVuZ3RoKTtcbiAgICBmb3IgKHZhciBpbmRleCA9IDAsIHJhbmQ7IGluZGV4IDwgbGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgICByYW5kID0gXy5yYW5kb20oMCwgaW5kZXgpO1xuICAgICAgaWYgKHJhbmQgIT09IGluZGV4KSBzaHVmZmxlZFtpbmRleF0gPSBzaHVmZmxlZFtyYW5kXTtcbiAgICAgIHNodWZmbGVkW3JhbmRdID0gc2V0W2luZGV4XTtcbiAgICB9XG4gICAgcmV0dXJuIHNodWZmbGVkO1xuICB9O1xuXG4gIC8vIFNhbXBsZSAqKm4qKiByYW5kb20gdmFsdWVzIGZyb20gYSBjb2xsZWN0aW9uLlxuICAvLyBJZiAqKm4qKiBpcyBub3Qgc3BlY2lmaWVkLCByZXR1cm5zIGEgc2luZ2xlIHJhbmRvbSBlbGVtZW50LlxuICAvLyBUaGUgaW50ZXJuYWwgYGd1YXJkYCBhcmd1bWVudCBhbGxvd3MgaXQgdG8gd29yayB3aXRoIGBtYXBgLlxuICBfLnNhbXBsZSA9IGZ1bmN0aW9uKG9iaiwgbiwgZ3VhcmQpIHtcbiAgICBpZiAobiA9PSBudWxsIHx8IGd1YXJkKSB7XG4gICAgICBpZiAoIWlzQXJyYXlMaWtlKG9iaikpIG9iaiA9IF8udmFsdWVzKG9iaik7XG4gICAgICByZXR1cm4gb2JqW18ucmFuZG9tKG9iai5sZW5ndGggLSAxKV07XG4gICAgfVxuICAgIHJldHVybiBfLnNodWZmbGUob2JqKS5zbGljZSgwLCBNYXRoLm1heCgwLCBuKSk7XG4gIH07XG5cbiAgLy8gU29ydCB0aGUgb2JqZWN0J3MgdmFsdWVzIGJ5IGEgY3JpdGVyaW9uIHByb2R1Y2VkIGJ5IGFuIGl0ZXJhdGVlLlxuICBfLnNvcnRCeSA9IGZ1bmN0aW9uKG9iaiwgaXRlcmF0ZWUsIGNvbnRleHQpIHtcbiAgICBpdGVyYXRlZSA9IGNiKGl0ZXJhdGVlLCBjb250ZXh0KTtcbiAgICByZXR1cm4gXy5wbHVjayhfLm1hcChvYmosIGZ1bmN0aW9uKHZhbHVlLCBpbmRleCwgbGlzdCkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdmFsdWU6IHZhbHVlLFxuICAgICAgICBpbmRleDogaW5kZXgsXG4gICAgICAgIGNyaXRlcmlhOiBpdGVyYXRlZSh2YWx1ZSwgaW5kZXgsIGxpc3QpXG4gICAgICB9O1xuICAgIH0pLnNvcnQoZnVuY3Rpb24obGVmdCwgcmlnaHQpIHtcbiAgICAgIHZhciBhID0gbGVmdC5jcml0ZXJpYTtcbiAgICAgIHZhciBiID0gcmlnaHQuY3JpdGVyaWE7XG4gICAgICBpZiAoYSAhPT0gYikge1xuICAgICAgICBpZiAoYSA+IGIgfHwgYSA9PT0gdm9pZCAwKSByZXR1cm4gMTtcbiAgICAgICAgaWYgKGEgPCBiIHx8IGIgPT09IHZvaWQgMCkgcmV0dXJuIC0xO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGxlZnQuaW5kZXggLSByaWdodC5pbmRleDtcbiAgICB9KSwgJ3ZhbHVlJyk7XG4gIH07XG5cbiAgLy8gQW4gaW50ZXJuYWwgZnVuY3Rpb24gdXNlZCBmb3IgYWdncmVnYXRlIFwiZ3JvdXAgYnlcIiBvcGVyYXRpb25zLlxuICB2YXIgZ3JvdXAgPSBmdW5jdGlvbihiZWhhdmlvcikge1xuICAgIHJldHVybiBmdW5jdGlvbihvYmosIGl0ZXJhdGVlLCBjb250ZXh0KSB7XG4gICAgICB2YXIgcmVzdWx0ID0ge307XG4gICAgICBpdGVyYXRlZSA9IGNiKGl0ZXJhdGVlLCBjb250ZXh0KTtcbiAgICAgIF8uZWFjaChvYmosIGZ1bmN0aW9uKHZhbHVlLCBpbmRleCkge1xuICAgICAgICB2YXIga2V5ID0gaXRlcmF0ZWUodmFsdWUsIGluZGV4LCBvYmopO1xuICAgICAgICBiZWhhdmlvcihyZXN1bHQsIHZhbHVlLCBrZXkpO1xuICAgICAgfSk7XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH07XG4gIH07XG5cbiAgLy8gR3JvdXBzIHRoZSBvYmplY3QncyB2YWx1ZXMgYnkgYSBjcml0ZXJpb24uIFBhc3MgZWl0aGVyIGEgc3RyaW5nIGF0dHJpYnV0ZVxuICAvLyB0byBncm91cCBieSwgb3IgYSBmdW5jdGlvbiB0aGF0IHJldHVybnMgdGhlIGNyaXRlcmlvbi5cbiAgXy5ncm91cEJ5ID0gZ3JvdXAoZnVuY3Rpb24ocmVzdWx0LCB2YWx1ZSwga2V5KSB7XG4gICAgaWYgKF8uaGFzKHJlc3VsdCwga2V5KSkgcmVzdWx0W2tleV0ucHVzaCh2YWx1ZSk7IGVsc2UgcmVzdWx0W2tleV0gPSBbdmFsdWVdO1xuICB9KTtcblxuICAvLyBJbmRleGVzIHRoZSBvYmplY3QncyB2YWx1ZXMgYnkgYSBjcml0ZXJpb24sIHNpbWlsYXIgdG8gYGdyb3VwQnlgLCBidXQgZm9yXG4gIC8vIHdoZW4geW91IGtub3cgdGhhdCB5b3VyIGluZGV4IHZhbHVlcyB3aWxsIGJlIHVuaXF1ZS5cbiAgXy5pbmRleEJ5ID0gZ3JvdXAoZnVuY3Rpb24ocmVzdWx0LCB2YWx1ZSwga2V5KSB7XG4gICAgcmVzdWx0W2tleV0gPSB2YWx1ZTtcbiAgfSk7XG5cbiAgLy8gQ291bnRzIGluc3RhbmNlcyBvZiBhbiBvYmplY3QgdGhhdCBncm91cCBieSBhIGNlcnRhaW4gY3JpdGVyaW9uLiBQYXNzXG4gIC8vIGVpdGhlciBhIHN0cmluZyBhdHRyaWJ1dGUgdG8gY291bnQgYnksIG9yIGEgZnVuY3Rpb24gdGhhdCByZXR1cm5zIHRoZVxuICAvLyBjcml0ZXJpb24uXG4gIF8uY291bnRCeSA9IGdyb3VwKGZ1bmN0aW9uKHJlc3VsdCwgdmFsdWUsIGtleSkge1xuICAgIGlmIChfLmhhcyhyZXN1bHQsIGtleSkpIHJlc3VsdFtrZXldKys7IGVsc2UgcmVzdWx0W2tleV0gPSAxO1xuICB9KTtcblxuICAvLyBTYWZlbHkgY3JlYXRlIGEgcmVhbCwgbGl2ZSBhcnJheSBmcm9tIGFueXRoaW5nIGl0ZXJhYmxlLlxuICBfLnRvQXJyYXkgPSBmdW5jdGlvbihvYmopIHtcbiAgICBpZiAoIW9iaikgcmV0dXJuIFtdO1xuICAgIGlmIChfLmlzQXJyYXkob2JqKSkgcmV0dXJuIHNsaWNlLmNhbGwob2JqKTtcbiAgICBpZiAoaXNBcnJheUxpa2Uob2JqKSkgcmV0dXJuIF8ubWFwKG9iaiwgXy5pZGVudGl0eSk7XG4gICAgcmV0dXJuIF8udmFsdWVzKG9iaik7XG4gIH07XG5cbiAgLy8gUmV0dXJuIHRoZSBudW1iZXIgb2YgZWxlbWVudHMgaW4gYW4gb2JqZWN0LlxuICBfLnNpemUgPSBmdW5jdGlvbihvYmopIHtcbiAgICBpZiAob2JqID09IG51bGwpIHJldHVybiAwO1xuICAgIHJldHVybiBpc0FycmF5TGlrZShvYmopID8gb2JqLmxlbmd0aCA6IF8ua2V5cyhvYmopLmxlbmd0aDtcbiAgfTtcblxuICAvLyBTcGxpdCBhIGNvbGxlY3Rpb24gaW50byB0d28gYXJyYXlzOiBvbmUgd2hvc2UgZWxlbWVudHMgYWxsIHNhdGlzZnkgdGhlIGdpdmVuXG4gIC8vIHByZWRpY2F0ZSwgYW5kIG9uZSB3aG9zZSBlbGVtZW50cyBhbGwgZG8gbm90IHNhdGlzZnkgdGhlIHByZWRpY2F0ZS5cbiAgXy5wYXJ0aXRpb24gPSBmdW5jdGlvbihvYmosIHByZWRpY2F0ZSwgY29udGV4dCkge1xuICAgIHByZWRpY2F0ZSA9IGNiKHByZWRpY2F0ZSwgY29udGV4dCk7XG4gICAgdmFyIHBhc3MgPSBbXSwgZmFpbCA9IFtdO1xuICAgIF8uZWFjaChvYmosIGZ1bmN0aW9uKHZhbHVlLCBrZXksIG9iaikge1xuICAgICAgKHByZWRpY2F0ZSh2YWx1ZSwga2V5LCBvYmopID8gcGFzcyA6IGZhaWwpLnB1c2godmFsdWUpO1xuICAgIH0pO1xuICAgIHJldHVybiBbcGFzcywgZmFpbF07XG4gIH07XG5cbiAgLy8gQXJyYXkgRnVuY3Rpb25zXG4gIC8vIC0tLS0tLS0tLS0tLS0tLVxuXG4gIC8vIEdldCB0aGUgZmlyc3QgZWxlbWVudCBvZiBhbiBhcnJheS4gUGFzc2luZyAqKm4qKiB3aWxsIHJldHVybiB0aGUgZmlyc3QgTlxuICAvLyB2YWx1ZXMgaW4gdGhlIGFycmF5LiBBbGlhc2VkIGFzIGBoZWFkYCBhbmQgYHRha2VgLiBUaGUgKipndWFyZCoqIGNoZWNrXG4gIC8vIGFsbG93cyBpdCB0byB3b3JrIHdpdGggYF8ubWFwYC5cbiAgXy5maXJzdCA9IF8uaGVhZCA9IF8udGFrZSA9IGZ1bmN0aW9uKGFycmF5LCBuLCBndWFyZCkge1xuICAgIGlmIChhcnJheSA9PSBudWxsKSByZXR1cm4gdm9pZCAwO1xuICAgIGlmIChuID09IG51bGwgfHwgZ3VhcmQpIHJldHVybiBhcnJheVswXTtcbiAgICByZXR1cm4gXy5pbml0aWFsKGFycmF5LCBhcnJheS5sZW5ndGggLSBuKTtcbiAgfTtcblxuICAvLyBSZXR1cm5zIGV2ZXJ5dGhpbmcgYnV0IHRoZSBsYXN0IGVudHJ5IG9mIHRoZSBhcnJheS4gRXNwZWNpYWxseSB1c2VmdWwgb25cbiAgLy8gdGhlIGFyZ3VtZW50cyBvYmplY3QuIFBhc3NpbmcgKipuKiogd2lsbCByZXR1cm4gYWxsIHRoZSB2YWx1ZXMgaW5cbiAgLy8gdGhlIGFycmF5LCBleGNsdWRpbmcgdGhlIGxhc3QgTi5cbiAgXy5pbml0aWFsID0gZnVuY3Rpb24oYXJyYXksIG4sIGd1YXJkKSB7XG4gICAgcmV0dXJuIHNsaWNlLmNhbGwoYXJyYXksIDAsIE1hdGgubWF4KDAsIGFycmF5Lmxlbmd0aCAtIChuID09IG51bGwgfHwgZ3VhcmQgPyAxIDogbikpKTtcbiAgfTtcblxuICAvLyBHZXQgdGhlIGxhc3QgZWxlbWVudCBvZiBhbiBhcnJheS4gUGFzc2luZyAqKm4qKiB3aWxsIHJldHVybiB0aGUgbGFzdCBOXG4gIC8vIHZhbHVlcyBpbiB0aGUgYXJyYXkuXG4gIF8ubGFzdCA9IGZ1bmN0aW9uKGFycmF5LCBuLCBndWFyZCkge1xuICAgIGlmIChhcnJheSA9PSBudWxsKSByZXR1cm4gdm9pZCAwO1xuICAgIGlmIChuID09IG51bGwgfHwgZ3VhcmQpIHJldHVybiBhcnJheVthcnJheS5sZW5ndGggLSAxXTtcbiAgICByZXR1cm4gXy5yZXN0KGFycmF5LCBNYXRoLm1heCgwLCBhcnJheS5sZW5ndGggLSBuKSk7XG4gIH07XG5cbiAgLy8gUmV0dXJucyBldmVyeXRoaW5nIGJ1dCB0aGUgZmlyc3QgZW50cnkgb2YgdGhlIGFycmF5LiBBbGlhc2VkIGFzIGB0YWlsYCBhbmQgYGRyb3BgLlxuICAvLyBFc3BlY2lhbGx5IHVzZWZ1bCBvbiB0aGUgYXJndW1lbnRzIG9iamVjdC4gUGFzc2luZyBhbiAqKm4qKiB3aWxsIHJldHVyblxuICAvLyB0aGUgcmVzdCBOIHZhbHVlcyBpbiB0aGUgYXJyYXkuXG4gIF8ucmVzdCA9IF8udGFpbCA9IF8uZHJvcCA9IGZ1bmN0aW9uKGFycmF5LCBuLCBndWFyZCkge1xuICAgIHJldHVybiBzbGljZS5jYWxsKGFycmF5LCBuID09IG51bGwgfHwgZ3VhcmQgPyAxIDogbik7XG4gIH07XG5cbiAgLy8gVHJpbSBvdXQgYWxsIGZhbHN5IHZhbHVlcyBmcm9tIGFuIGFycmF5LlxuICBfLmNvbXBhY3QgPSBmdW5jdGlvbihhcnJheSkge1xuICAgIHJldHVybiBfLmZpbHRlcihhcnJheSwgXy5pZGVudGl0eSk7XG4gIH07XG5cbiAgLy8gSW50ZXJuYWwgaW1wbGVtZW50YXRpb24gb2YgYSByZWN1cnNpdmUgYGZsYXR0ZW5gIGZ1bmN0aW9uLlxuICB2YXIgZmxhdHRlbiA9IGZ1bmN0aW9uKGlucHV0LCBzaGFsbG93LCBzdHJpY3QsIHN0YXJ0SW5kZXgpIHtcbiAgICB2YXIgb3V0cHV0ID0gW10sIGlkeCA9IDA7XG4gICAgZm9yICh2YXIgaSA9IHN0YXJ0SW5kZXggfHwgMCwgbGVuZ3RoID0gZ2V0TGVuZ3RoKGlucHV0KTsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgdmFsdWUgPSBpbnB1dFtpXTtcbiAgICAgIGlmIChpc0FycmF5TGlrZSh2YWx1ZSkgJiYgKF8uaXNBcnJheSh2YWx1ZSkgfHwgXy5pc0FyZ3VtZW50cyh2YWx1ZSkpKSB7XG4gICAgICAgIC8vZmxhdHRlbiBjdXJyZW50IGxldmVsIG9mIGFycmF5IG9yIGFyZ3VtZW50cyBvYmplY3RcbiAgICAgICAgaWYgKCFzaGFsbG93KSB2YWx1ZSA9IGZsYXR0ZW4odmFsdWUsIHNoYWxsb3csIHN0cmljdCk7XG4gICAgICAgIHZhciBqID0gMCwgbGVuID0gdmFsdWUubGVuZ3RoO1xuICAgICAgICBvdXRwdXQubGVuZ3RoICs9IGxlbjtcbiAgICAgICAgd2hpbGUgKGogPCBsZW4pIHtcbiAgICAgICAgICBvdXRwdXRbaWR4KytdID0gdmFsdWVbaisrXTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmICghc3RyaWN0KSB7XG4gICAgICAgIG91dHB1dFtpZHgrK10gPSB2YWx1ZTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG91dHB1dDtcbiAgfTtcblxuICAvLyBGbGF0dGVuIG91dCBhbiBhcnJheSwgZWl0aGVyIHJlY3Vyc2l2ZWx5IChieSBkZWZhdWx0KSwgb3IganVzdCBvbmUgbGV2ZWwuXG4gIF8uZmxhdHRlbiA9IGZ1bmN0aW9uKGFycmF5LCBzaGFsbG93KSB7XG4gICAgcmV0dXJuIGZsYXR0ZW4oYXJyYXksIHNoYWxsb3csIGZhbHNlKTtcbiAgfTtcblxuICAvLyBSZXR1cm4gYSB2ZXJzaW9uIG9mIHRoZSBhcnJheSB0aGF0IGRvZXMgbm90IGNvbnRhaW4gdGhlIHNwZWNpZmllZCB2YWx1ZShzKS5cbiAgXy53aXRob3V0ID0gZnVuY3Rpb24oYXJyYXkpIHtcbiAgICByZXR1cm4gXy5kaWZmZXJlbmNlKGFycmF5LCBzbGljZS5jYWxsKGFyZ3VtZW50cywgMSkpO1xuICB9O1xuXG4gIC8vIFByb2R1Y2UgYSBkdXBsaWNhdGUtZnJlZSB2ZXJzaW9uIG9mIHRoZSBhcnJheS4gSWYgdGhlIGFycmF5IGhhcyBhbHJlYWR5XG4gIC8vIGJlZW4gc29ydGVkLCB5b3UgaGF2ZSB0aGUgb3B0aW9uIG9mIHVzaW5nIGEgZmFzdGVyIGFsZ29yaXRobS5cbiAgLy8gQWxpYXNlZCBhcyBgdW5pcXVlYC5cbiAgXy51bmlxID0gXy51bmlxdWUgPSBmdW5jdGlvbihhcnJheSwgaXNTb3J0ZWQsIGl0ZXJhdGVlLCBjb250ZXh0KSB7XG4gICAgaWYgKCFfLmlzQm9vbGVhbihpc1NvcnRlZCkpIHtcbiAgICAgIGNvbnRleHQgPSBpdGVyYXRlZTtcbiAgICAgIGl0ZXJhdGVlID0gaXNTb3J0ZWQ7XG4gICAgICBpc1NvcnRlZCA9IGZhbHNlO1xuICAgIH1cbiAgICBpZiAoaXRlcmF0ZWUgIT0gbnVsbCkgaXRlcmF0ZWUgPSBjYihpdGVyYXRlZSwgY29udGV4dCk7XG4gICAgdmFyIHJlc3VsdCA9IFtdO1xuICAgIHZhciBzZWVuID0gW107XG4gICAgZm9yICh2YXIgaSA9IDAsIGxlbmd0aCA9IGdldExlbmd0aChhcnJheSk7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgdmFyIHZhbHVlID0gYXJyYXlbaV0sXG4gICAgICAgICAgY29tcHV0ZWQgPSBpdGVyYXRlZSA/IGl0ZXJhdGVlKHZhbHVlLCBpLCBhcnJheSkgOiB2YWx1ZTtcbiAgICAgIGlmIChpc1NvcnRlZCkge1xuICAgICAgICBpZiAoIWkgfHwgc2VlbiAhPT0gY29tcHV0ZWQpIHJlc3VsdC5wdXNoKHZhbHVlKTtcbiAgICAgICAgc2VlbiA9IGNvbXB1dGVkO1xuICAgICAgfSBlbHNlIGlmIChpdGVyYXRlZSkge1xuICAgICAgICBpZiAoIV8uY29udGFpbnMoc2VlbiwgY29tcHV0ZWQpKSB7XG4gICAgICAgICAgc2Vlbi5wdXNoKGNvbXB1dGVkKTtcbiAgICAgICAgICByZXN1bHQucHVzaCh2YWx1ZSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoIV8uY29udGFpbnMocmVzdWx0LCB2YWx1ZSkpIHtcbiAgICAgICAgcmVzdWx0LnB1c2godmFsdWUpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9O1xuXG4gIC8vIFByb2R1Y2UgYW4gYXJyYXkgdGhhdCBjb250YWlucyB0aGUgdW5pb246IGVhY2ggZGlzdGluY3QgZWxlbWVudCBmcm9tIGFsbCBvZlxuICAvLyB0aGUgcGFzc2VkLWluIGFycmF5cy5cbiAgXy51bmlvbiA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBfLnVuaXEoZmxhdHRlbihhcmd1bWVudHMsIHRydWUsIHRydWUpKTtcbiAgfTtcblxuICAvLyBQcm9kdWNlIGFuIGFycmF5IHRoYXQgY29udGFpbnMgZXZlcnkgaXRlbSBzaGFyZWQgYmV0d2VlbiBhbGwgdGhlXG4gIC8vIHBhc3NlZC1pbiBhcnJheXMuXG4gIF8uaW50ZXJzZWN0aW9uID0gZnVuY3Rpb24oYXJyYXkpIHtcbiAgICB2YXIgcmVzdWx0ID0gW107XG4gICAgdmFyIGFyZ3NMZW5ndGggPSBhcmd1bWVudHMubGVuZ3RoO1xuICAgIGZvciAodmFyIGkgPSAwLCBsZW5ndGggPSBnZXRMZW5ndGgoYXJyYXkpOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBpdGVtID0gYXJyYXlbaV07XG4gICAgICBpZiAoXy5jb250YWlucyhyZXN1bHQsIGl0ZW0pKSBjb250aW51ZTtcbiAgICAgIGZvciAodmFyIGogPSAxOyBqIDwgYXJnc0xlbmd0aDsgaisrKSB7XG4gICAgICAgIGlmICghXy5jb250YWlucyhhcmd1bWVudHNbal0sIGl0ZW0pKSBicmVhaztcbiAgICAgIH1cbiAgICAgIGlmIChqID09PSBhcmdzTGVuZ3RoKSByZXN1bHQucHVzaChpdGVtKTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfTtcblxuICAvLyBUYWtlIHRoZSBkaWZmZXJlbmNlIGJldHdlZW4gb25lIGFycmF5IGFuZCBhIG51bWJlciBvZiBvdGhlciBhcnJheXMuXG4gIC8vIE9ubHkgdGhlIGVsZW1lbnRzIHByZXNlbnQgaW4ganVzdCB0aGUgZmlyc3QgYXJyYXkgd2lsbCByZW1haW4uXG4gIF8uZGlmZmVyZW5jZSA9IGZ1bmN0aW9uKGFycmF5KSB7XG4gICAgdmFyIHJlc3QgPSBmbGF0dGVuKGFyZ3VtZW50cywgdHJ1ZSwgdHJ1ZSwgMSk7XG4gICAgcmV0dXJuIF8uZmlsdGVyKGFycmF5LCBmdW5jdGlvbih2YWx1ZSl7XG4gICAgICByZXR1cm4gIV8uY29udGFpbnMocmVzdCwgdmFsdWUpO1xuICAgIH0pO1xuICB9O1xuXG4gIC8vIFppcCB0b2dldGhlciBtdWx0aXBsZSBsaXN0cyBpbnRvIGEgc2luZ2xlIGFycmF5IC0tIGVsZW1lbnRzIHRoYXQgc2hhcmVcbiAgLy8gYW4gaW5kZXggZ28gdG9nZXRoZXIuXG4gIF8uemlwID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIF8udW56aXAoYXJndW1lbnRzKTtcbiAgfTtcblxuICAvLyBDb21wbGVtZW50IG9mIF8uemlwLiBVbnppcCBhY2NlcHRzIGFuIGFycmF5IG9mIGFycmF5cyBhbmQgZ3JvdXBzXG4gIC8vIGVhY2ggYXJyYXkncyBlbGVtZW50cyBvbiBzaGFyZWQgaW5kaWNlc1xuICBfLnVuemlwID0gZnVuY3Rpb24oYXJyYXkpIHtcbiAgICB2YXIgbGVuZ3RoID0gYXJyYXkgJiYgXy5tYXgoYXJyYXksIGdldExlbmd0aCkubGVuZ3RoIHx8IDA7XG4gICAgdmFyIHJlc3VsdCA9IEFycmF5KGxlbmd0aCk7XG5cbiAgICBmb3IgKHZhciBpbmRleCA9IDA7IGluZGV4IDwgbGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgICByZXN1bHRbaW5kZXhdID0gXy5wbHVjayhhcnJheSwgaW5kZXgpO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9O1xuXG4gIC8vIENvbnZlcnRzIGxpc3RzIGludG8gb2JqZWN0cy4gUGFzcyBlaXRoZXIgYSBzaW5nbGUgYXJyYXkgb2YgYFtrZXksIHZhbHVlXWBcbiAgLy8gcGFpcnMsIG9yIHR3byBwYXJhbGxlbCBhcnJheXMgb2YgdGhlIHNhbWUgbGVuZ3RoIC0tIG9uZSBvZiBrZXlzLCBhbmQgb25lIG9mXG4gIC8vIHRoZSBjb3JyZXNwb25kaW5nIHZhbHVlcy5cbiAgXy5vYmplY3QgPSBmdW5jdGlvbihsaXN0LCB2YWx1ZXMpIHtcbiAgICB2YXIgcmVzdWx0ID0ge307XG4gICAgZm9yICh2YXIgaSA9IDAsIGxlbmd0aCA9IGdldExlbmd0aChsaXN0KTsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAodmFsdWVzKSB7XG4gICAgICAgIHJlc3VsdFtsaXN0W2ldXSA9IHZhbHVlc1tpXTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJlc3VsdFtsaXN0W2ldWzBdXSA9IGxpc3RbaV1bMV07XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH07XG5cbiAgLy8gR2VuZXJhdG9yIGZ1bmN0aW9uIHRvIGNyZWF0ZSB0aGUgZmluZEluZGV4IGFuZCBmaW5kTGFzdEluZGV4IGZ1bmN0aW9uc1xuICBmdW5jdGlvbiBjcmVhdGVQcmVkaWNhdGVJbmRleEZpbmRlcihkaXIpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oYXJyYXksIHByZWRpY2F0ZSwgY29udGV4dCkge1xuICAgICAgcHJlZGljYXRlID0gY2IocHJlZGljYXRlLCBjb250ZXh0KTtcbiAgICAgIHZhciBsZW5ndGggPSBnZXRMZW5ndGgoYXJyYXkpO1xuICAgICAgdmFyIGluZGV4ID0gZGlyID4gMCA/IDAgOiBsZW5ndGggLSAxO1xuICAgICAgZm9yICg7IGluZGV4ID49IDAgJiYgaW5kZXggPCBsZW5ndGg7IGluZGV4ICs9IGRpcikge1xuICAgICAgICBpZiAocHJlZGljYXRlKGFycmF5W2luZGV4XSwgaW5kZXgsIGFycmF5KSkgcmV0dXJuIGluZGV4O1xuICAgICAgfVxuICAgICAgcmV0dXJuIC0xO1xuICAgIH07XG4gIH1cblxuICAvLyBSZXR1cm5zIHRoZSBmaXJzdCBpbmRleCBvbiBhbiBhcnJheS1saWtlIHRoYXQgcGFzc2VzIGEgcHJlZGljYXRlIHRlc3RcbiAgXy5maW5kSW5kZXggPSBjcmVhdGVQcmVkaWNhdGVJbmRleEZpbmRlcigxKTtcbiAgXy5maW5kTGFzdEluZGV4ID0gY3JlYXRlUHJlZGljYXRlSW5kZXhGaW5kZXIoLTEpO1xuXG4gIC8vIFVzZSBhIGNvbXBhcmF0b3IgZnVuY3Rpb24gdG8gZmlndXJlIG91dCB0aGUgc21hbGxlc3QgaW5kZXggYXQgd2hpY2hcbiAgLy8gYW4gb2JqZWN0IHNob3VsZCBiZSBpbnNlcnRlZCBzbyBhcyB0byBtYWludGFpbiBvcmRlci4gVXNlcyBiaW5hcnkgc2VhcmNoLlxuICBfLnNvcnRlZEluZGV4ID0gZnVuY3Rpb24oYXJyYXksIG9iaiwgaXRlcmF0ZWUsIGNvbnRleHQpIHtcbiAgICBpdGVyYXRlZSA9IGNiKGl0ZXJhdGVlLCBjb250ZXh0LCAxKTtcbiAgICB2YXIgdmFsdWUgPSBpdGVyYXRlZShvYmopO1xuICAgIHZhciBsb3cgPSAwLCBoaWdoID0gZ2V0TGVuZ3RoKGFycmF5KTtcbiAgICB3aGlsZSAobG93IDwgaGlnaCkge1xuICAgICAgdmFyIG1pZCA9IE1hdGguZmxvb3IoKGxvdyArIGhpZ2gpIC8gMik7XG4gICAgICBpZiAoaXRlcmF0ZWUoYXJyYXlbbWlkXSkgPCB2YWx1ZSkgbG93ID0gbWlkICsgMTsgZWxzZSBoaWdoID0gbWlkO1xuICAgIH1cbiAgICByZXR1cm4gbG93O1xuICB9O1xuXG4gIC8vIEdlbmVyYXRvciBmdW5jdGlvbiB0byBjcmVhdGUgdGhlIGluZGV4T2YgYW5kIGxhc3RJbmRleE9mIGZ1bmN0aW9uc1xuICBmdW5jdGlvbiBjcmVhdGVJbmRleEZpbmRlcihkaXIsIHByZWRpY2F0ZUZpbmQsIHNvcnRlZEluZGV4KSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKGFycmF5LCBpdGVtLCBpZHgpIHtcbiAgICAgIHZhciBpID0gMCwgbGVuZ3RoID0gZ2V0TGVuZ3RoKGFycmF5KTtcbiAgICAgIGlmICh0eXBlb2YgaWR4ID09ICdudW1iZXInKSB7XG4gICAgICAgIGlmIChkaXIgPiAwKSB7XG4gICAgICAgICAgICBpID0gaWR4ID49IDAgPyBpZHggOiBNYXRoLm1heChpZHggKyBsZW5ndGgsIGkpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbGVuZ3RoID0gaWR4ID49IDAgPyBNYXRoLm1pbihpZHggKyAxLCBsZW5ndGgpIDogaWR4ICsgbGVuZ3RoICsgMTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChzb3J0ZWRJbmRleCAmJiBpZHggJiYgbGVuZ3RoKSB7XG4gICAgICAgIGlkeCA9IHNvcnRlZEluZGV4KGFycmF5LCBpdGVtKTtcbiAgICAgICAgcmV0dXJuIGFycmF5W2lkeF0gPT09IGl0ZW0gPyBpZHggOiAtMTtcbiAgICAgIH1cbiAgICAgIGlmIChpdGVtICE9PSBpdGVtKSB7XG4gICAgICAgIGlkeCA9IHByZWRpY2F0ZUZpbmQoc2xpY2UuY2FsbChhcnJheSwgaSwgbGVuZ3RoKSwgXy5pc05hTik7XG4gICAgICAgIHJldHVybiBpZHggPj0gMCA/IGlkeCArIGkgOiAtMTtcbiAgICAgIH1cbiAgICAgIGZvciAoaWR4ID0gZGlyID4gMCA/IGkgOiBsZW5ndGggLSAxOyBpZHggPj0gMCAmJiBpZHggPCBsZW5ndGg7IGlkeCArPSBkaXIpIHtcbiAgICAgICAgaWYgKGFycmF5W2lkeF0gPT09IGl0ZW0pIHJldHVybiBpZHg7XG4gICAgICB9XG4gICAgICByZXR1cm4gLTE7XG4gICAgfTtcbiAgfVxuXG4gIC8vIFJldHVybiB0aGUgcG9zaXRpb24gb2YgdGhlIGZpcnN0IG9jY3VycmVuY2Ugb2YgYW4gaXRlbSBpbiBhbiBhcnJheSxcbiAgLy8gb3IgLTEgaWYgdGhlIGl0ZW0gaXMgbm90IGluY2x1ZGVkIGluIHRoZSBhcnJheS5cbiAgLy8gSWYgdGhlIGFycmF5IGlzIGxhcmdlIGFuZCBhbHJlYWR5IGluIHNvcnQgb3JkZXIsIHBhc3MgYHRydWVgXG4gIC8vIGZvciAqKmlzU29ydGVkKiogdG8gdXNlIGJpbmFyeSBzZWFyY2guXG4gIF8uaW5kZXhPZiA9IGNyZWF0ZUluZGV4RmluZGVyKDEsIF8uZmluZEluZGV4LCBfLnNvcnRlZEluZGV4KTtcbiAgXy5sYXN0SW5kZXhPZiA9IGNyZWF0ZUluZGV4RmluZGVyKC0xLCBfLmZpbmRMYXN0SW5kZXgpO1xuXG4gIC8vIEdlbmVyYXRlIGFuIGludGVnZXIgQXJyYXkgY29udGFpbmluZyBhbiBhcml0aG1ldGljIHByb2dyZXNzaW9uLiBBIHBvcnQgb2ZcbiAgLy8gdGhlIG5hdGl2ZSBQeXRob24gYHJhbmdlKClgIGZ1bmN0aW9uLiBTZWVcbiAgLy8gW3RoZSBQeXRob24gZG9jdW1lbnRhdGlvbl0oaHR0cDovL2RvY3MucHl0aG9uLm9yZy9saWJyYXJ5L2Z1bmN0aW9ucy5odG1sI3JhbmdlKS5cbiAgXy5yYW5nZSA9IGZ1bmN0aW9uKHN0YXJ0LCBzdG9wLCBzdGVwKSB7XG4gICAgaWYgKHN0b3AgPT0gbnVsbCkge1xuICAgICAgc3RvcCA9IHN0YXJ0IHx8IDA7XG4gICAgICBzdGFydCA9IDA7XG4gICAgfVxuICAgIHN0ZXAgPSBzdGVwIHx8IDE7XG5cbiAgICB2YXIgbGVuZ3RoID0gTWF0aC5tYXgoTWF0aC5jZWlsKChzdG9wIC0gc3RhcnQpIC8gc3RlcCksIDApO1xuICAgIHZhciByYW5nZSA9IEFycmF5KGxlbmd0aCk7XG5cbiAgICBmb3IgKHZhciBpZHggPSAwOyBpZHggPCBsZW5ndGg7IGlkeCsrLCBzdGFydCArPSBzdGVwKSB7XG4gICAgICByYW5nZVtpZHhdID0gc3RhcnQ7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJhbmdlO1xuICB9O1xuXG4gIC8vIEZ1bmN0aW9uIChhaGVtKSBGdW5jdGlvbnNcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgLy8gRGV0ZXJtaW5lcyB3aGV0aGVyIHRvIGV4ZWN1dGUgYSBmdW5jdGlvbiBhcyBhIGNvbnN0cnVjdG9yXG4gIC8vIG9yIGEgbm9ybWFsIGZ1bmN0aW9uIHdpdGggdGhlIHByb3ZpZGVkIGFyZ3VtZW50c1xuICB2YXIgZXhlY3V0ZUJvdW5kID0gZnVuY3Rpb24oc291cmNlRnVuYywgYm91bmRGdW5jLCBjb250ZXh0LCBjYWxsaW5nQ29udGV4dCwgYXJncykge1xuICAgIGlmICghKGNhbGxpbmdDb250ZXh0IGluc3RhbmNlb2YgYm91bmRGdW5jKSkgcmV0dXJuIHNvdXJjZUZ1bmMuYXBwbHkoY29udGV4dCwgYXJncyk7XG4gICAgdmFyIHNlbGYgPSBiYXNlQ3JlYXRlKHNvdXJjZUZ1bmMucHJvdG90eXBlKTtcbiAgICB2YXIgcmVzdWx0ID0gc291cmNlRnVuYy5hcHBseShzZWxmLCBhcmdzKTtcbiAgICBpZiAoXy5pc09iamVjdChyZXN1bHQpKSByZXR1cm4gcmVzdWx0O1xuICAgIHJldHVybiBzZWxmO1xuICB9O1xuXG4gIC8vIENyZWF0ZSBhIGZ1bmN0aW9uIGJvdW5kIHRvIGEgZ2l2ZW4gb2JqZWN0IChhc3NpZ25pbmcgYHRoaXNgLCBhbmQgYXJndW1lbnRzLFxuICAvLyBvcHRpb25hbGx5KS4gRGVsZWdhdGVzIHRvICoqRUNNQVNjcmlwdCA1KioncyBuYXRpdmUgYEZ1bmN0aW9uLmJpbmRgIGlmXG4gIC8vIGF2YWlsYWJsZS5cbiAgXy5iaW5kID0gZnVuY3Rpb24oZnVuYywgY29udGV4dCkge1xuICAgIGlmIChuYXRpdmVCaW5kICYmIGZ1bmMuYmluZCA9PT0gbmF0aXZlQmluZCkgcmV0dXJuIG5hdGl2ZUJpbmQuYXBwbHkoZnVuYywgc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpKTtcbiAgICBpZiAoIV8uaXNGdW5jdGlvbihmdW5jKSkgdGhyb3cgbmV3IFR5cGVFcnJvcignQmluZCBtdXN0IGJlIGNhbGxlZCBvbiBhIGZ1bmN0aW9uJyk7XG4gICAgdmFyIGFyZ3MgPSBzbGljZS5jYWxsKGFyZ3VtZW50cywgMik7XG4gICAgdmFyIGJvdW5kID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gZXhlY3V0ZUJvdW5kKGZ1bmMsIGJvdW5kLCBjb250ZXh0LCB0aGlzLCBhcmdzLmNvbmNhdChzbGljZS5jYWxsKGFyZ3VtZW50cykpKTtcbiAgICB9O1xuICAgIHJldHVybiBib3VuZDtcbiAgfTtcblxuICAvLyBQYXJ0aWFsbHkgYXBwbHkgYSBmdW5jdGlvbiBieSBjcmVhdGluZyBhIHZlcnNpb24gdGhhdCBoYXMgaGFkIHNvbWUgb2YgaXRzXG4gIC8vIGFyZ3VtZW50cyBwcmUtZmlsbGVkLCB3aXRob3V0IGNoYW5naW5nIGl0cyBkeW5hbWljIGB0aGlzYCBjb250ZXh0LiBfIGFjdHNcbiAgLy8gYXMgYSBwbGFjZWhvbGRlciwgYWxsb3dpbmcgYW55IGNvbWJpbmF0aW9uIG9mIGFyZ3VtZW50cyB0byBiZSBwcmUtZmlsbGVkLlxuICBfLnBhcnRpYWwgPSBmdW5jdGlvbihmdW5jKSB7XG4gICAgdmFyIGJvdW5kQXJncyA9IHNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcbiAgICB2YXIgYm91bmQgPSBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBwb3NpdGlvbiA9IDAsIGxlbmd0aCA9IGJvdW5kQXJncy5sZW5ndGg7XG4gICAgICB2YXIgYXJncyA9IEFycmF5KGxlbmd0aCk7XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGFyZ3NbaV0gPSBib3VuZEFyZ3NbaV0gPT09IF8gPyBhcmd1bWVudHNbcG9zaXRpb24rK10gOiBib3VuZEFyZ3NbaV07XG4gICAgICB9XG4gICAgICB3aGlsZSAocG9zaXRpb24gPCBhcmd1bWVudHMubGVuZ3RoKSBhcmdzLnB1c2goYXJndW1lbnRzW3Bvc2l0aW9uKytdKTtcbiAgICAgIHJldHVybiBleGVjdXRlQm91bmQoZnVuYywgYm91bmQsIHRoaXMsIHRoaXMsIGFyZ3MpO1xuICAgIH07XG4gICAgcmV0dXJuIGJvdW5kO1xuICB9O1xuXG4gIC8vIEJpbmQgYSBudW1iZXIgb2YgYW4gb2JqZWN0J3MgbWV0aG9kcyB0byB0aGF0IG9iamVjdC4gUmVtYWluaW5nIGFyZ3VtZW50c1xuICAvLyBhcmUgdGhlIG1ldGhvZCBuYW1lcyB0byBiZSBib3VuZC4gVXNlZnVsIGZvciBlbnN1cmluZyB0aGF0IGFsbCBjYWxsYmFja3NcbiAgLy8gZGVmaW5lZCBvbiBhbiBvYmplY3QgYmVsb25nIHRvIGl0LlxuICBfLmJpbmRBbGwgPSBmdW5jdGlvbihvYmopIHtcbiAgICB2YXIgaSwgbGVuZ3RoID0gYXJndW1lbnRzLmxlbmd0aCwga2V5O1xuICAgIGlmIChsZW5ndGggPD0gMSkgdGhyb3cgbmV3IEVycm9yKCdiaW5kQWxsIG11c3QgYmUgcGFzc2VkIGZ1bmN0aW9uIG5hbWVzJyk7XG4gICAgZm9yIChpID0gMTsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICBrZXkgPSBhcmd1bWVudHNbaV07XG4gICAgICBvYmpba2V5XSA9IF8uYmluZChvYmpba2V5XSwgb2JqKTtcbiAgICB9XG4gICAgcmV0dXJuIG9iajtcbiAgfTtcblxuICAvLyBNZW1vaXplIGFuIGV4cGVuc2l2ZSBmdW5jdGlvbiBieSBzdG9yaW5nIGl0cyByZXN1bHRzLlxuICBfLm1lbW9pemUgPSBmdW5jdGlvbihmdW5jLCBoYXNoZXIpIHtcbiAgICB2YXIgbWVtb2l6ZSA9IGZ1bmN0aW9uKGtleSkge1xuICAgICAgdmFyIGNhY2hlID0gbWVtb2l6ZS5jYWNoZTtcbiAgICAgIHZhciBhZGRyZXNzID0gJycgKyAoaGFzaGVyID8gaGFzaGVyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cykgOiBrZXkpO1xuICAgICAgaWYgKCFfLmhhcyhjYWNoZSwgYWRkcmVzcykpIGNhY2hlW2FkZHJlc3NdID0gZnVuYy5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgcmV0dXJuIGNhY2hlW2FkZHJlc3NdO1xuICAgIH07XG4gICAgbWVtb2l6ZS5jYWNoZSA9IHt9O1xuICAgIHJldHVybiBtZW1vaXplO1xuICB9O1xuXG4gIC8vIERlbGF5cyBhIGZ1bmN0aW9uIGZvciB0aGUgZ2l2ZW4gbnVtYmVyIG9mIG1pbGxpc2Vjb25kcywgYW5kIHRoZW4gY2FsbHNcbiAgLy8gaXQgd2l0aCB0aGUgYXJndW1lbnRzIHN1cHBsaWVkLlxuICBfLmRlbGF5ID0gZnVuY3Rpb24oZnVuYywgd2FpdCkge1xuICAgIHZhciBhcmdzID0gc2xpY2UuY2FsbChhcmd1bWVudHMsIDIpO1xuICAgIHJldHVybiBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICByZXR1cm4gZnVuYy5hcHBseShudWxsLCBhcmdzKTtcbiAgICB9LCB3YWl0KTtcbiAgfTtcblxuICAvLyBEZWZlcnMgYSBmdW5jdGlvbiwgc2NoZWR1bGluZyBpdCB0byBydW4gYWZ0ZXIgdGhlIGN1cnJlbnQgY2FsbCBzdGFjayBoYXNcbiAgLy8gY2xlYXJlZC5cbiAgXy5kZWZlciA9IF8ucGFydGlhbChfLmRlbGF5LCBfLCAxKTtcblxuICAvLyBSZXR1cm5zIGEgZnVuY3Rpb24sIHRoYXQsIHdoZW4gaW52b2tlZCwgd2lsbCBvbmx5IGJlIHRyaWdnZXJlZCBhdCBtb3N0IG9uY2VcbiAgLy8gZHVyaW5nIGEgZ2l2ZW4gd2luZG93IG9mIHRpbWUuIE5vcm1hbGx5LCB0aGUgdGhyb3R0bGVkIGZ1bmN0aW9uIHdpbGwgcnVuXG4gIC8vIGFzIG11Y2ggYXMgaXQgY2FuLCB3aXRob3V0IGV2ZXIgZ29pbmcgbW9yZSB0aGFuIG9uY2UgcGVyIGB3YWl0YCBkdXJhdGlvbjtcbiAgLy8gYnV0IGlmIHlvdSdkIGxpa2UgdG8gZGlzYWJsZSB0aGUgZXhlY3V0aW9uIG9uIHRoZSBsZWFkaW5nIGVkZ2UsIHBhc3NcbiAgLy8gYHtsZWFkaW5nOiBmYWxzZX1gLiBUbyBkaXNhYmxlIGV4ZWN1dGlvbiBvbiB0aGUgdHJhaWxpbmcgZWRnZSwgZGl0dG8uXG4gIF8udGhyb3R0bGUgPSBmdW5jdGlvbihmdW5jLCB3YWl0LCBvcHRpb25zKSB7XG4gICAgdmFyIGNvbnRleHQsIGFyZ3MsIHJlc3VsdDtcbiAgICB2YXIgdGltZW91dCA9IG51bGw7XG4gICAgdmFyIHByZXZpb3VzID0gMDtcbiAgICBpZiAoIW9wdGlvbnMpIG9wdGlvbnMgPSB7fTtcbiAgICB2YXIgbGF0ZXIgPSBmdW5jdGlvbigpIHtcbiAgICAgIHByZXZpb3VzID0gb3B0aW9ucy5sZWFkaW5nID09PSBmYWxzZSA/IDAgOiBfLm5vdygpO1xuICAgICAgdGltZW91dCA9IG51bGw7XG4gICAgICByZXN1bHQgPSBmdW5jLmFwcGx5KGNvbnRleHQsIGFyZ3MpO1xuICAgICAgaWYgKCF0aW1lb3V0KSBjb250ZXh0ID0gYXJncyA9IG51bGw7XG4gICAgfTtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgbm93ID0gXy5ub3coKTtcbiAgICAgIGlmICghcHJldmlvdXMgJiYgb3B0aW9ucy5sZWFkaW5nID09PSBmYWxzZSkgcHJldmlvdXMgPSBub3c7XG4gICAgICB2YXIgcmVtYWluaW5nID0gd2FpdCAtIChub3cgLSBwcmV2aW91cyk7XG4gICAgICBjb250ZXh0ID0gdGhpcztcbiAgICAgIGFyZ3MgPSBhcmd1bWVudHM7XG4gICAgICBpZiAocmVtYWluaW5nIDw9IDAgfHwgcmVtYWluaW5nID4gd2FpdCkge1xuICAgICAgICBpZiAodGltZW91dCkge1xuICAgICAgICAgIGNsZWFyVGltZW91dCh0aW1lb3V0KTtcbiAgICAgICAgICB0aW1lb3V0ID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBwcmV2aW91cyA9IG5vdztcbiAgICAgICAgcmVzdWx0ID0gZnVuYy5hcHBseShjb250ZXh0LCBhcmdzKTtcbiAgICAgICAgaWYgKCF0aW1lb3V0KSBjb250ZXh0ID0gYXJncyA9IG51bGw7XG4gICAgICB9IGVsc2UgaWYgKCF0aW1lb3V0ICYmIG9wdGlvbnMudHJhaWxpbmcgIT09IGZhbHNlKSB7XG4gICAgICAgIHRpbWVvdXQgPSBzZXRUaW1lb3V0KGxhdGVyLCByZW1haW5pbmcpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9O1xuICB9O1xuXG4gIC8vIFJldHVybnMgYSBmdW5jdGlvbiwgdGhhdCwgYXMgbG9uZyBhcyBpdCBjb250aW51ZXMgdG8gYmUgaW52b2tlZCwgd2lsbCBub3RcbiAgLy8gYmUgdHJpZ2dlcmVkLiBUaGUgZnVuY3Rpb24gd2lsbCBiZSBjYWxsZWQgYWZ0ZXIgaXQgc3RvcHMgYmVpbmcgY2FsbGVkIGZvclxuICAvLyBOIG1pbGxpc2Vjb25kcy4gSWYgYGltbWVkaWF0ZWAgaXMgcGFzc2VkLCB0cmlnZ2VyIHRoZSBmdW5jdGlvbiBvbiB0aGVcbiAgLy8gbGVhZGluZyBlZGdlLCBpbnN0ZWFkIG9mIHRoZSB0cmFpbGluZy5cbiAgXy5kZWJvdW5jZSA9IGZ1bmN0aW9uKGZ1bmMsIHdhaXQsIGltbWVkaWF0ZSkge1xuICAgIHZhciB0aW1lb3V0LCBhcmdzLCBjb250ZXh0LCB0aW1lc3RhbXAsIHJlc3VsdDtcblxuICAgIHZhciBsYXRlciA9IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGxhc3QgPSBfLm5vdygpIC0gdGltZXN0YW1wO1xuXG4gICAgICBpZiAobGFzdCA8IHdhaXQgJiYgbGFzdCA+PSAwKSB7XG4gICAgICAgIHRpbWVvdXQgPSBzZXRUaW1lb3V0KGxhdGVyLCB3YWl0IC0gbGFzdCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aW1lb3V0ID0gbnVsbDtcbiAgICAgICAgaWYgKCFpbW1lZGlhdGUpIHtcbiAgICAgICAgICByZXN1bHQgPSBmdW5jLmFwcGx5KGNvbnRleHQsIGFyZ3MpO1xuICAgICAgICAgIGlmICghdGltZW91dCkgY29udGV4dCA9IGFyZ3MgPSBudWxsO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfTtcblxuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIGNvbnRleHQgPSB0aGlzO1xuICAgICAgYXJncyA9IGFyZ3VtZW50cztcbiAgICAgIHRpbWVzdGFtcCA9IF8ubm93KCk7XG4gICAgICB2YXIgY2FsbE5vdyA9IGltbWVkaWF0ZSAmJiAhdGltZW91dDtcbiAgICAgIGlmICghdGltZW91dCkgdGltZW91dCA9IHNldFRpbWVvdXQobGF0ZXIsIHdhaXQpO1xuICAgICAgaWYgKGNhbGxOb3cpIHtcbiAgICAgICAgcmVzdWx0ID0gZnVuYy5hcHBseShjb250ZXh0LCBhcmdzKTtcbiAgICAgICAgY29udGV4dCA9IGFyZ3MgPSBudWxsO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH07XG4gIH07XG5cbiAgLy8gUmV0dXJucyB0aGUgZmlyc3QgZnVuY3Rpb24gcGFzc2VkIGFzIGFuIGFyZ3VtZW50IHRvIHRoZSBzZWNvbmQsXG4gIC8vIGFsbG93aW5nIHlvdSB0byBhZGp1c3QgYXJndW1lbnRzLCBydW4gY29kZSBiZWZvcmUgYW5kIGFmdGVyLCBhbmRcbiAgLy8gY29uZGl0aW9uYWxseSBleGVjdXRlIHRoZSBvcmlnaW5hbCBmdW5jdGlvbi5cbiAgXy53cmFwID0gZnVuY3Rpb24oZnVuYywgd3JhcHBlcikge1xuICAgIHJldHVybiBfLnBhcnRpYWwod3JhcHBlciwgZnVuYyk7XG4gIH07XG5cbiAgLy8gUmV0dXJucyBhIG5lZ2F0ZWQgdmVyc2lvbiBvZiB0aGUgcGFzc2VkLWluIHByZWRpY2F0ZS5cbiAgXy5uZWdhdGUgPSBmdW5jdGlvbihwcmVkaWNhdGUpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gIXByZWRpY2F0ZS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH07XG4gIH07XG5cbiAgLy8gUmV0dXJucyBhIGZ1bmN0aW9uIHRoYXQgaXMgdGhlIGNvbXBvc2l0aW9uIG9mIGEgbGlzdCBvZiBmdW5jdGlvbnMsIGVhY2hcbiAgLy8gY29uc3VtaW5nIHRoZSByZXR1cm4gdmFsdWUgb2YgdGhlIGZ1bmN0aW9uIHRoYXQgZm9sbG93cy5cbiAgXy5jb21wb3NlID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGFyZ3MgPSBhcmd1bWVudHM7XG4gICAgdmFyIHN0YXJ0ID0gYXJncy5sZW5ndGggLSAxO1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBpID0gc3RhcnQ7XG4gICAgICB2YXIgcmVzdWx0ID0gYXJnc1tzdGFydF0uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgIHdoaWxlIChpLS0pIHJlc3VsdCA9IGFyZ3NbaV0uY2FsbCh0aGlzLCByZXN1bHQpO1xuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9O1xuICB9O1xuXG4gIC8vIFJldHVybnMgYSBmdW5jdGlvbiB0aGF0IHdpbGwgb25seSBiZSBleGVjdXRlZCBvbiBhbmQgYWZ0ZXIgdGhlIE50aCBjYWxsLlxuICBfLmFmdGVyID0gZnVuY3Rpb24odGltZXMsIGZ1bmMpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICBpZiAoLS10aW1lcyA8IDEpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmMuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgIH1cbiAgICB9O1xuICB9O1xuXG4gIC8vIFJldHVybnMgYSBmdW5jdGlvbiB0aGF0IHdpbGwgb25seSBiZSBleGVjdXRlZCB1cCB0byAoYnV0IG5vdCBpbmNsdWRpbmcpIHRoZSBOdGggY2FsbC5cbiAgXy5iZWZvcmUgPSBmdW5jdGlvbih0aW1lcywgZnVuYykge1xuICAgIHZhciBtZW1vO1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIGlmICgtLXRpbWVzID4gMCkge1xuICAgICAgICBtZW1vID0gZnVuYy5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgfVxuICAgICAgaWYgKHRpbWVzIDw9IDEpIGZ1bmMgPSBudWxsO1xuICAgICAgcmV0dXJuIG1lbW87XG4gICAgfTtcbiAgfTtcblxuICAvLyBSZXR1cm5zIGEgZnVuY3Rpb24gdGhhdCB3aWxsIGJlIGV4ZWN1dGVkIGF0IG1vc3Qgb25lIHRpbWUsIG5vIG1hdHRlciBob3dcbiAgLy8gb2Z0ZW4geW91IGNhbGwgaXQuIFVzZWZ1bCBmb3IgbGF6eSBpbml0aWFsaXphdGlvbi5cbiAgXy5vbmNlID0gXy5wYXJ0aWFsKF8uYmVmb3JlLCAyKTtcblxuICAvLyBPYmplY3QgRnVuY3Rpb25zXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS1cblxuICAvLyBLZXlzIGluIElFIDwgOSB0aGF0IHdvbid0IGJlIGl0ZXJhdGVkIGJ5IGBmb3Iga2V5IGluIC4uLmAgYW5kIHRodXMgbWlzc2VkLlxuICB2YXIgaGFzRW51bUJ1ZyA9ICF7dG9TdHJpbmc6IG51bGx9LnByb3BlcnR5SXNFbnVtZXJhYmxlKCd0b1N0cmluZycpO1xuICB2YXIgbm9uRW51bWVyYWJsZVByb3BzID0gWyd2YWx1ZU9mJywgJ2lzUHJvdG90eXBlT2YnLCAndG9TdHJpbmcnLFxuICAgICAgICAgICAgICAgICAgICAgICdwcm9wZXJ0eUlzRW51bWVyYWJsZScsICdoYXNPd25Qcm9wZXJ0eScsICd0b0xvY2FsZVN0cmluZyddO1xuXG4gIGZ1bmN0aW9uIGNvbGxlY3ROb25FbnVtUHJvcHMob2JqLCBrZXlzKSB7XG4gICAgdmFyIG5vbkVudW1JZHggPSBub25FbnVtZXJhYmxlUHJvcHMubGVuZ3RoO1xuICAgIHZhciBjb25zdHJ1Y3RvciA9IG9iai5jb25zdHJ1Y3RvcjtcbiAgICB2YXIgcHJvdG8gPSAoXy5pc0Z1bmN0aW9uKGNvbnN0cnVjdG9yKSAmJiBjb25zdHJ1Y3Rvci5wcm90b3R5cGUpIHx8IE9ialByb3RvO1xuXG4gICAgLy8gQ29uc3RydWN0b3IgaXMgYSBzcGVjaWFsIGNhc2UuXG4gICAgdmFyIHByb3AgPSAnY29uc3RydWN0b3InO1xuICAgIGlmIChfLmhhcyhvYmosIHByb3ApICYmICFfLmNvbnRhaW5zKGtleXMsIHByb3ApKSBrZXlzLnB1c2gocHJvcCk7XG5cbiAgICB3aGlsZSAobm9uRW51bUlkeC0tKSB7XG4gICAgICBwcm9wID0gbm9uRW51bWVyYWJsZVByb3BzW25vbkVudW1JZHhdO1xuICAgICAgaWYgKHByb3AgaW4gb2JqICYmIG9ialtwcm9wXSAhPT0gcHJvdG9bcHJvcF0gJiYgIV8uY29udGFpbnMoa2V5cywgcHJvcCkpIHtcbiAgICAgICAga2V5cy5wdXNoKHByb3ApO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8vIFJldHJpZXZlIHRoZSBuYW1lcyBvZiBhbiBvYmplY3QncyBvd24gcHJvcGVydGllcy5cbiAgLy8gRGVsZWdhdGVzIHRvICoqRUNNQVNjcmlwdCA1KioncyBuYXRpdmUgYE9iamVjdC5rZXlzYFxuICBfLmtleXMgPSBmdW5jdGlvbihvYmopIHtcbiAgICBpZiAoIV8uaXNPYmplY3Qob2JqKSkgcmV0dXJuIFtdO1xuICAgIGlmIChuYXRpdmVLZXlzKSByZXR1cm4gbmF0aXZlS2V5cyhvYmopO1xuICAgIHZhciBrZXlzID0gW107XG4gICAgZm9yICh2YXIga2V5IGluIG9iaikgaWYgKF8uaGFzKG9iaiwga2V5KSkga2V5cy5wdXNoKGtleSk7XG4gICAgLy8gQWhlbSwgSUUgPCA5LlxuICAgIGlmIChoYXNFbnVtQnVnKSBjb2xsZWN0Tm9uRW51bVByb3BzKG9iaiwga2V5cyk7XG4gICAgcmV0dXJuIGtleXM7XG4gIH07XG5cbiAgLy8gUmV0cmlldmUgYWxsIHRoZSBwcm9wZXJ0eSBuYW1lcyBvZiBhbiBvYmplY3QuXG4gIF8uYWxsS2V5cyA9IGZ1bmN0aW9uKG9iaikge1xuICAgIGlmICghXy5pc09iamVjdChvYmopKSByZXR1cm4gW107XG4gICAgdmFyIGtleXMgPSBbXTtcbiAgICBmb3IgKHZhciBrZXkgaW4gb2JqKSBrZXlzLnB1c2goa2V5KTtcbiAgICAvLyBBaGVtLCBJRSA8IDkuXG4gICAgaWYgKGhhc0VudW1CdWcpIGNvbGxlY3ROb25FbnVtUHJvcHMob2JqLCBrZXlzKTtcbiAgICByZXR1cm4ga2V5cztcbiAgfTtcblxuICAvLyBSZXRyaWV2ZSB0aGUgdmFsdWVzIG9mIGFuIG9iamVjdCdzIHByb3BlcnRpZXMuXG4gIF8udmFsdWVzID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgdmFyIGtleXMgPSBfLmtleXMob2JqKTtcbiAgICB2YXIgbGVuZ3RoID0ga2V5cy5sZW5ndGg7XG4gICAgdmFyIHZhbHVlcyA9IEFycmF5KGxlbmd0aCk7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgdmFsdWVzW2ldID0gb2JqW2tleXNbaV1dO1xuICAgIH1cbiAgICByZXR1cm4gdmFsdWVzO1xuICB9O1xuXG4gIC8vIFJldHVybnMgdGhlIHJlc3VsdHMgb2YgYXBwbHlpbmcgdGhlIGl0ZXJhdGVlIHRvIGVhY2ggZWxlbWVudCBvZiB0aGUgb2JqZWN0XG4gIC8vIEluIGNvbnRyYXN0IHRvIF8ubWFwIGl0IHJldHVybnMgYW4gb2JqZWN0XG4gIF8ubWFwT2JqZWN0ID0gZnVuY3Rpb24ob2JqLCBpdGVyYXRlZSwgY29udGV4dCkge1xuICAgIGl0ZXJhdGVlID0gY2IoaXRlcmF0ZWUsIGNvbnRleHQpO1xuICAgIHZhciBrZXlzID0gIF8ua2V5cyhvYmopLFxuICAgICAgICAgIGxlbmd0aCA9IGtleXMubGVuZ3RoLFxuICAgICAgICAgIHJlc3VsdHMgPSB7fSxcbiAgICAgICAgICBjdXJyZW50S2V5O1xuICAgICAgZm9yICh2YXIgaW5kZXggPSAwOyBpbmRleCA8IGxlbmd0aDsgaW5kZXgrKykge1xuICAgICAgICBjdXJyZW50S2V5ID0ga2V5c1tpbmRleF07XG4gICAgICAgIHJlc3VsdHNbY3VycmVudEtleV0gPSBpdGVyYXRlZShvYmpbY3VycmVudEtleV0sIGN1cnJlbnRLZXksIG9iaik7XG4gICAgICB9XG4gICAgICByZXR1cm4gcmVzdWx0cztcbiAgfTtcblxuICAvLyBDb252ZXJ0IGFuIG9iamVjdCBpbnRvIGEgbGlzdCBvZiBgW2tleSwgdmFsdWVdYCBwYWlycy5cbiAgXy5wYWlycyA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHZhciBrZXlzID0gXy5rZXlzKG9iaik7XG4gICAgdmFyIGxlbmd0aCA9IGtleXMubGVuZ3RoO1xuICAgIHZhciBwYWlycyA9IEFycmF5KGxlbmd0aCk7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgcGFpcnNbaV0gPSBba2V5c1tpXSwgb2JqW2tleXNbaV1dXTtcbiAgICB9XG4gICAgcmV0dXJuIHBhaXJzO1xuICB9O1xuXG4gIC8vIEludmVydCB0aGUga2V5cyBhbmQgdmFsdWVzIG9mIGFuIG9iamVjdC4gVGhlIHZhbHVlcyBtdXN0IGJlIHNlcmlhbGl6YWJsZS5cbiAgXy5pbnZlcnQgPSBmdW5jdGlvbihvYmopIHtcbiAgICB2YXIgcmVzdWx0ID0ge307XG4gICAgdmFyIGtleXMgPSBfLmtleXMob2JqKTtcbiAgICBmb3IgKHZhciBpID0gMCwgbGVuZ3RoID0ga2V5cy5sZW5ndGg7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgcmVzdWx0W29ialtrZXlzW2ldXV0gPSBrZXlzW2ldO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9O1xuXG4gIC8vIFJldHVybiBhIHNvcnRlZCBsaXN0IG9mIHRoZSBmdW5jdGlvbiBuYW1lcyBhdmFpbGFibGUgb24gdGhlIG9iamVjdC5cbiAgLy8gQWxpYXNlZCBhcyBgbWV0aG9kc2BcbiAgXy5mdW5jdGlvbnMgPSBfLm1ldGhvZHMgPSBmdW5jdGlvbihvYmopIHtcbiAgICB2YXIgbmFtZXMgPSBbXTtcbiAgICBmb3IgKHZhciBrZXkgaW4gb2JqKSB7XG4gICAgICBpZiAoXy5pc0Z1bmN0aW9uKG9ialtrZXldKSkgbmFtZXMucHVzaChrZXkpO1xuICAgIH1cbiAgICByZXR1cm4gbmFtZXMuc29ydCgpO1xuICB9O1xuXG4gIC8vIEV4dGVuZCBhIGdpdmVuIG9iamVjdCB3aXRoIGFsbCB0aGUgcHJvcGVydGllcyBpbiBwYXNzZWQtaW4gb2JqZWN0KHMpLlxuICBfLmV4dGVuZCA9IGNyZWF0ZUFzc2lnbmVyKF8uYWxsS2V5cyk7XG5cbiAgLy8gQXNzaWducyBhIGdpdmVuIG9iamVjdCB3aXRoIGFsbCB0aGUgb3duIHByb3BlcnRpZXMgaW4gdGhlIHBhc3NlZC1pbiBvYmplY3QocylcbiAgLy8gKGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2RvY3MvV2ViL0phdmFTY3JpcHQvUmVmZXJlbmNlL0dsb2JhbF9PYmplY3RzL09iamVjdC9hc3NpZ24pXG4gIF8uZXh0ZW5kT3duID0gXy5hc3NpZ24gPSBjcmVhdGVBc3NpZ25lcihfLmtleXMpO1xuXG4gIC8vIFJldHVybnMgdGhlIGZpcnN0IGtleSBvbiBhbiBvYmplY3QgdGhhdCBwYXNzZXMgYSBwcmVkaWNhdGUgdGVzdFxuICBfLmZpbmRLZXkgPSBmdW5jdGlvbihvYmosIHByZWRpY2F0ZSwgY29udGV4dCkge1xuICAgIHByZWRpY2F0ZSA9IGNiKHByZWRpY2F0ZSwgY29udGV4dCk7XG4gICAgdmFyIGtleXMgPSBfLmtleXMob2JqKSwga2V5O1xuICAgIGZvciAodmFyIGkgPSAwLCBsZW5ndGggPSBrZXlzLmxlbmd0aDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICBrZXkgPSBrZXlzW2ldO1xuICAgICAgaWYgKHByZWRpY2F0ZShvYmpba2V5XSwga2V5LCBvYmopKSByZXR1cm4ga2V5O1xuICAgIH1cbiAgfTtcblxuICAvLyBSZXR1cm4gYSBjb3B5IG9mIHRoZSBvYmplY3Qgb25seSBjb250YWluaW5nIHRoZSB3aGl0ZWxpc3RlZCBwcm9wZXJ0aWVzLlxuICBfLnBpY2sgPSBmdW5jdGlvbihvYmplY3QsIG9pdGVyYXRlZSwgY29udGV4dCkge1xuICAgIHZhciByZXN1bHQgPSB7fSwgb2JqID0gb2JqZWN0LCBpdGVyYXRlZSwga2V5cztcbiAgICBpZiAob2JqID09IG51bGwpIHJldHVybiByZXN1bHQ7XG4gICAgaWYgKF8uaXNGdW5jdGlvbihvaXRlcmF0ZWUpKSB7XG4gICAgICBrZXlzID0gXy5hbGxLZXlzKG9iaik7XG4gICAgICBpdGVyYXRlZSA9IG9wdGltaXplQ2Iob2l0ZXJhdGVlLCBjb250ZXh0KTtcbiAgICB9IGVsc2Uge1xuICAgICAga2V5cyA9IGZsYXR0ZW4oYXJndW1lbnRzLCBmYWxzZSwgZmFsc2UsIDEpO1xuICAgICAgaXRlcmF0ZWUgPSBmdW5jdGlvbih2YWx1ZSwga2V5LCBvYmopIHsgcmV0dXJuIGtleSBpbiBvYmo7IH07XG4gICAgICBvYmogPSBPYmplY3Qob2JqKTtcbiAgICB9XG4gICAgZm9yICh2YXIgaSA9IDAsIGxlbmd0aCA9IGtleXMubGVuZ3RoOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBrZXkgPSBrZXlzW2ldO1xuICAgICAgdmFyIHZhbHVlID0gb2JqW2tleV07XG4gICAgICBpZiAoaXRlcmF0ZWUodmFsdWUsIGtleSwgb2JqKSkgcmVzdWx0W2tleV0gPSB2YWx1ZTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfTtcblxuICAgLy8gUmV0dXJuIGEgY29weSBvZiB0aGUgb2JqZWN0IHdpdGhvdXQgdGhlIGJsYWNrbGlzdGVkIHByb3BlcnRpZXMuXG4gIF8ub21pdCA9IGZ1bmN0aW9uKG9iaiwgaXRlcmF0ZWUsIGNvbnRleHQpIHtcbiAgICBpZiAoXy5pc0Z1bmN0aW9uKGl0ZXJhdGVlKSkge1xuICAgICAgaXRlcmF0ZWUgPSBfLm5lZ2F0ZShpdGVyYXRlZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciBrZXlzID0gXy5tYXAoZmxhdHRlbihhcmd1bWVudHMsIGZhbHNlLCBmYWxzZSwgMSksIFN0cmluZyk7XG4gICAgICBpdGVyYXRlZSA9IGZ1bmN0aW9uKHZhbHVlLCBrZXkpIHtcbiAgICAgICAgcmV0dXJuICFfLmNvbnRhaW5zKGtleXMsIGtleSk7XG4gICAgICB9O1xuICAgIH1cbiAgICByZXR1cm4gXy5waWNrKG9iaiwgaXRlcmF0ZWUsIGNvbnRleHQpO1xuICB9O1xuXG4gIC8vIEZpbGwgaW4gYSBnaXZlbiBvYmplY3Qgd2l0aCBkZWZhdWx0IHByb3BlcnRpZXMuXG4gIF8uZGVmYXVsdHMgPSBjcmVhdGVBc3NpZ25lcihfLmFsbEtleXMsIHRydWUpO1xuXG4gIC8vIENyZWF0ZXMgYW4gb2JqZWN0IHRoYXQgaW5oZXJpdHMgZnJvbSB0aGUgZ2l2ZW4gcHJvdG90eXBlIG9iamVjdC5cbiAgLy8gSWYgYWRkaXRpb25hbCBwcm9wZXJ0aWVzIGFyZSBwcm92aWRlZCB0aGVuIHRoZXkgd2lsbCBiZSBhZGRlZCB0byB0aGVcbiAgLy8gY3JlYXRlZCBvYmplY3QuXG4gIF8uY3JlYXRlID0gZnVuY3Rpb24ocHJvdG90eXBlLCBwcm9wcykge1xuICAgIHZhciByZXN1bHQgPSBiYXNlQ3JlYXRlKHByb3RvdHlwZSk7XG4gICAgaWYgKHByb3BzKSBfLmV4dGVuZE93bihyZXN1bHQsIHByb3BzKTtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9O1xuXG4gIC8vIENyZWF0ZSBhIChzaGFsbG93LWNsb25lZCkgZHVwbGljYXRlIG9mIGFuIG9iamVjdC5cbiAgXy5jbG9uZSA9IGZ1bmN0aW9uKG9iaikge1xuICAgIGlmICghXy5pc09iamVjdChvYmopKSByZXR1cm4gb2JqO1xuICAgIHJldHVybiBfLmlzQXJyYXkob2JqKSA/IG9iai5zbGljZSgpIDogXy5leHRlbmQoe30sIG9iaik7XG4gIH07XG5cbiAgLy8gSW52b2tlcyBpbnRlcmNlcHRvciB3aXRoIHRoZSBvYmosIGFuZCB0aGVuIHJldHVybnMgb2JqLlxuICAvLyBUaGUgcHJpbWFyeSBwdXJwb3NlIG9mIHRoaXMgbWV0aG9kIGlzIHRvIFwidGFwIGludG9cIiBhIG1ldGhvZCBjaGFpbiwgaW5cbiAgLy8gb3JkZXIgdG8gcGVyZm9ybSBvcGVyYXRpb25zIG9uIGludGVybWVkaWF0ZSByZXN1bHRzIHdpdGhpbiB0aGUgY2hhaW4uXG4gIF8udGFwID0gZnVuY3Rpb24ob2JqLCBpbnRlcmNlcHRvcikge1xuICAgIGludGVyY2VwdG9yKG9iaik7XG4gICAgcmV0dXJuIG9iajtcbiAgfTtcblxuICAvLyBSZXR1cm5zIHdoZXRoZXIgYW4gb2JqZWN0IGhhcyBhIGdpdmVuIHNldCBvZiBga2V5OnZhbHVlYCBwYWlycy5cbiAgXy5pc01hdGNoID0gZnVuY3Rpb24ob2JqZWN0LCBhdHRycykge1xuICAgIHZhciBrZXlzID0gXy5rZXlzKGF0dHJzKSwgbGVuZ3RoID0ga2V5cy5sZW5ndGg7XG4gICAgaWYgKG9iamVjdCA9PSBudWxsKSByZXR1cm4gIWxlbmd0aDtcbiAgICB2YXIgb2JqID0gT2JqZWN0KG9iamVjdCk7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgdmFyIGtleSA9IGtleXNbaV07XG4gICAgICBpZiAoYXR0cnNba2V5XSAhPT0gb2JqW2tleV0gfHwgIShrZXkgaW4gb2JqKSkgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfTtcblxuXG4gIC8vIEludGVybmFsIHJlY3Vyc2l2ZSBjb21wYXJpc29uIGZ1bmN0aW9uIGZvciBgaXNFcXVhbGAuXG4gIHZhciBlcSA9IGZ1bmN0aW9uKGEsIGIsIGFTdGFjaywgYlN0YWNrKSB7XG4gICAgLy8gSWRlbnRpY2FsIG9iamVjdHMgYXJlIGVxdWFsLiBgMCA9PT0gLTBgLCBidXQgdGhleSBhcmVuJ3QgaWRlbnRpY2FsLlxuICAgIC8vIFNlZSB0aGUgW0hhcm1vbnkgYGVnYWxgIHByb3Bvc2FsXShodHRwOi8vd2lraS5lY21hc2NyaXB0Lm9yZy9kb2t1LnBocD9pZD1oYXJtb255OmVnYWwpLlxuICAgIGlmIChhID09PSBiKSByZXR1cm4gYSAhPT0gMCB8fCAxIC8gYSA9PT0gMSAvIGI7XG4gICAgLy8gQSBzdHJpY3QgY29tcGFyaXNvbiBpcyBuZWNlc3NhcnkgYmVjYXVzZSBgbnVsbCA9PSB1bmRlZmluZWRgLlxuICAgIGlmIChhID09IG51bGwgfHwgYiA9PSBudWxsKSByZXR1cm4gYSA9PT0gYjtcbiAgICAvLyBVbndyYXAgYW55IHdyYXBwZWQgb2JqZWN0cy5cbiAgICBpZiAoYSBpbnN0YW5jZW9mIF8pIGEgPSBhLl93cmFwcGVkO1xuICAgIGlmIChiIGluc3RhbmNlb2YgXykgYiA9IGIuX3dyYXBwZWQ7XG4gICAgLy8gQ29tcGFyZSBgW1tDbGFzc11dYCBuYW1lcy5cbiAgICB2YXIgY2xhc3NOYW1lID0gdG9TdHJpbmcuY2FsbChhKTtcbiAgICBpZiAoY2xhc3NOYW1lICE9PSB0b1N0cmluZy5jYWxsKGIpKSByZXR1cm4gZmFsc2U7XG4gICAgc3dpdGNoIChjbGFzc05hbWUpIHtcbiAgICAgIC8vIFN0cmluZ3MsIG51bWJlcnMsIHJlZ3VsYXIgZXhwcmVzc2lvbnMsIGRhdGVzLCBhbmQgYm9vbGVhbnMgYXJlIGNvbXBhcmVkIGJ5IHZhbHVlLlxuICAgICAgY2FzZSAnW29iamVjdCBSZWdFeHBdJzpcbiAgICAgIC8vIFJlZ0V4cHMgYXJlIGNvZXJjZWQgdG8gc3RyaW5ncyBmb3IgY29tcGFyaXNvbiAoTm90ZTogJycgKyAvYS9pID09PSAnL2EvaScpXG4gICAgICBjYXNlICdbb2JqZWN0IFN0cmluZ10nOlxuICAgICAgICAvLyBQcmltaXRpdmVzIGFuZCB0aGVpciBjb3JyZXNwb25kaW5nIG9iamVjdCB3cmFwcGVycyBhcmUgZXF1aXZhbGVudDsgdGh1cywgYFwiNVwiYCBpc1xuICAgICAgICAvLyBlcXVpdmFsZW50IHRvIGBuZXcgU3RyaW5nKFwiNVwiKWAuXG4gICAgICAgIHJldHVybiAnJyArIGEgPT09ICcnICsgYjtcbiAgICAgIGNhc2UgJ1tvYmplY3QgTnVtYmVyXSc6XG4gICAgICAgIC8vIGBOYU5gcyBhcmUgZXF1aXZhbGVudCwgYnV0IG5vbi1yZWZsZXhpdmUuXG4gICAgICAgIC8vIE9iamVjdChOYU4pIGlzIGVxdWl2YWxlbnQgdG8gTmFOXG4gICAgICAgIGlmICgrYSAhPT0gK2EpIHJldHVybiArYiAhPT0gK2I7XG4gICAgICAgIC8vIEFuIGBlZ2FsYCBjb21wYXJpc29uIGlzIHBlcmZvcm1lZCBmb3Igb3RoZXIgbnVtZXJpYyB2YWx1ZXMuXG4gICAgICAgIHJldHVybiArYSA9PT0gMCA/IDEgLyArYSA9PT0gMSAvIGIgOiArYSA9PT0gK2I7XG4gICAgICBjYXNlICdbb2JqZWN0IERhdGVdJzpcbiAgICAgIGNhc2UgJ1tvYmplY3QgQm9vbGVhbl0nOlxuICAgICAgICAvLyBDb2VyY2UgZGF0ZXMgYW5kIGJvb2xlYW5zIHRvIG51bWVyaWMgcHJpbWl0aXZlIHZhbHVlcy4gRGF0ZXMgYXJlIGNvbXBhcmVkIGJ5IHRoZWlyXG4gICAgICAgIC8vIG1pbGxpc2Vjb25kIHJlcHJlc2VudGF0aW9ucy4gTm90ZSB0aGF0IGludmFsaWQgZGF0ZXMgd2l0aCBtaWxsaXNlY29uZCByZXByZXNlbnRhdGlvbnNcbiAgICAgICAgLy8gb2YgYE5hTmAgYXJlIG5vdCBlcXVpdmFsZW50LlxuICAgICAgICByZXR1cm4gK2EgPT09ICtiO1xuICAgIH1cblxuICAgIHZhciBhcmVBcnJheXMgPSBjbGFzc05hbWUgPT09ICdbb2JqZWN0IEFycmF5XSc7XG4gICAgaWYgKCFhcmVBcnJheXMpIHtcbiAgICAgIGlmICh0eXBlb2YgYSAhPSAnb2JqZWN0JyB8fCB0eXBlb2YgYiAhPSAnb2JqZWN0JykgcmV0dXJuIGZhbHNlO1xuXG4gICAgICAvLyBPYmplY3RzIHdpdGggZGlmZmVyZW50IGNvbnN0cnVjdG9ycyBhcmUgbm90IGVxdWl2YWxlbnQsIGJ1dCBgT2JqZWN0YHMgb3IgYEFycmF5YHNcbiAgICAgIC8vIGZyb20gZGlmZmVyZW50IGZyYW1lcyBhcmUuXG4gICAgICB2YXIgYUN0b3IgPSBhLmNvbnN0cnVjdG9yLCBiQ3RvciA9IGIuY29uc3RydWN0b3I7XG4gICAgICBpZiAoYUN0b3IgIT09IGJDdG9yICYmICEoXy5pc0Z1bmN0aW9uKGFDdG9yKSAmJiBhQ3RvciBpbnN0YW5jZW9mIGFDdG9yICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXy5pc0Z1bmN0aW9uKGJDdG9yKSAmJiBiQ3RvciBpbnN0YW5jZW9mIGJDdG9yKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAmJiAoJ2NvbnN0cnVjdG9yJyBpbiBhICYmICdjb25zdHJ1Y3RvcicgaW4gYikpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgIH1cbiAgICAvLyBBc3N1bWUgZXF1YWxpdHkgZm9yIGN5Y2xpYyBzdHJ1Y3R1cmVzLiBUaGUgYWxnb3JpdGhtIGZvciBkZXRlY3RpbmcgY3ljbGljXG4gICAgLy8gc3RydWN0dXJlcyBpcyBhZGFwdGVkIGZyb20gRVMgNS4xIHNlY3Rpb24gMTUuMTIuMywgYWJzdHJhY3Qgb3BlcmF0aW9uIGBKT2AuXG5cbiAgICAvLyBJbml0aWFsaXppbmcgc3RhY2sgb2YgdHJhdmVyc2VkIG9iamVjdHMuXG4gICAgLy8gSXQncyBkb25lIGhlcmUgc2luY2Ugd2Ugb25seSBuZWVkIHRoZW0gZm9yIG9iamVjdHMgYW5kIGFycmF5cyBjb21wYXJpc29uLlxuICAgIGFTdGFjayA9IGFTdGFjayB8fCBbXTtcbiAgICBiU3RhY2sgPSBiU3RhY2sgfHwgW107XG4gICAgdmFyIGxlbmd0aCA9IGFTdGFjay5sZW5ndGg7XG4gICAgd2hpbGUgKGxlbmd0aC0tKSB7XG4gICAgICAvLyBMaW5lYXIgc2VhcmNoLiBQZXJmb3JtYW5jZSBpcyBpbnZlcnNlbHkgcHJvcG9ydGlvbmFsIHRvIHRoZSBudW1iZXIgb2ZcbiAgICAgIC8vIHVuaXF1ZSBuZXN0ZWQgc3RydWN0dXJlcy5cbiAgICAgIGlmIChhU3RhY2tbbGVuZ3RoXSA9PT0gYSkgcmV0dXJuIGJTdGFja1tsZW5ndGhdID09PSBiO1xuICAgIH1cblxuICAgIC8vIEFkZCB0aGUgZmlyc3Qgb2JqZWN0IHRvIHRoZSBzdGFjayBvZiB0cmF2ZXJzZWQgb2JqZWN0cy5cbiAgICBhU3RhY2sucHVzaChhKTtcbiAgICBiU3RhY2sucHVzaChiKTtcblxuICAgIC8vIFJlY3Vyc2l2ZWx5IGNvbXBhcmUgb2JqZWN0cyBhbmQgYXJyYXlzLlxuICAgIGlmIChhcmVBcnJheXMpIHtcbiAgICAgIC8vIENvbXBhcmUgYXJyYXkgbGVuZ3RocyB0byBkZXRlcm1pbmUgaWYgYSBkZWVwIGNvbXBhcmlzb24gaXMgbmVjZXNzYXJ5LlxuICAgICAgbGVuZ3RoID0gYS5sZW5ndGg7XG4gICAgICBpZiAobGVuZ3RoICE9PSBiLmxlbmd0aCkgcmV0dXJuIGZhbHNlO1xuICAgICAgLy8gRGVlcCBjb21wYXJlIHRoZSBjb250ZW50cywgaWdub3Jpbmcgbm9uLW51bWVyaWMgcHJvcGVydGllcy5cbiAgICAgIHdoaWxlIChsZW5ndGgtLSkge1xuICAgICAgICBpZiAoIWVxKGFbbGVuZ3RoXSwgYltsZW5ndGhdLCBhU3RhY2ssIGJTdGFjaykpIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gRGVlcCBjb21wYXJlIG9iamVjdHMuXG4gICAgICB2YXIga2V5cyA9IF8ua2V5cyhhKSwga2V5O1xuICAgICAgbGVuZ3RoID0ga2V5cy5sZW5ndGg7XG4gICAgICAvLyBFbnN1cmUgdGhhdCBib3RoIG9iamVjdHMgY29udGFpbiB0aGUgc2FtZSBudW1iZXIgb2YgcHJvcGVydGllcyBiZWZvcmUgY29tcGFyaW5nIGRlZXAgZXF1YWxpdHkuXG4gICAgICBpZiAoXy5rZXlzKGIpLmxlbmd0aCAhPT0gbGVuZ3RoKSByZXR1cm4gZmFsc2U7XG4gICAgICB3aGlsZSAobGVuZ3RoLS0pIHtcbiAgICAgICAgLy8gRGVlcCBjb21wYXJlIGVhY2ggbWVtYmVyXG4gICAgICAgIGtleSA9IGtleXNbbGVuZ3RoXTtcbiAgICAgICAgaWYgKCEoXy5oYXMoYiwga2V5KSAmJiBlcShhW2tleV0sIGJba2V5XSwgYVN0YWNrLCBiU3RhY2spKSkgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgIH1cbiAgICAvLyBSZW1vdmUgdGhlIGZpcnN0IG9iamVjdCBmcm9tIHRoZSBzdGFjayBvZiB0cmF2ZXJzZWQgb2JqZWN0cy5cbiAgICBhU3RhY2sucG9wKCk7XG4gICAgYlN0YWNrLnBvcCgpO1xuICAgIHJldHVybiB0cnVlO1xuICB9O1xuXG4gIC8vIFBlcmZvcm0gYSBkZWVwIGNvbXBhcmlzb24gdG8gY2hlY2sgaWYgdHdvIG9iamVjdHMgYXJlIGVxdWFsLlxuICBfLmlzRXF1YWwgPSBmdW5jdGlvbihhLCBiKSB7XG4gICAgcmV0dXJuIGVxKGEsIGIpO1xuICB9O1xuXG4gIC8vIElzIGEgZ2l2ZW4gYXJyYXksIHN0cmluZywgb3Igb2JqZWN0IGVtcHR5P1xuICAvLyBBbiBcImVtcHR5XCIgb2JqZWN0IGhhcyBubyBlbnVtZXJhYmxlIG93bi1wcm9wZXJ0aWVzLlxuICBfLmlzRW1wdHkgPSBmdW5jdGlvbihvYmopIHtcbiAgICBpZiAob2JqID09IG51bGwpIHJldHVybiB0cnVlO1xuICAgIGlmIChpc0FycmF5TGlrZShvYmopICYmIChfLmlzQXJyYXkob2JqKSB8fCBfLmlzU3RyaW5nKG9iaikgfHwgXy5pc0FyZ3VtZW50cyhvYmopKSkgcmV0dXJuIG9iai5sZW5ndGggPT09IDA7XG4gICAgcmV0dXJuIF8ua2V5cyhvYmopLmxlbmd0aCA9PT0gMDtcbiAgfTtcblxuICAvLyBJcyBhIGdpdmVuIHZhbHVlIGEgRE9NIGVsZW1lbnQ/XG4gIF8uaXNFbGVtZW50ID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgcmV0dXJuICEhKG9iaiAmJiBvYmoubm9kZVR5cGUgPT09IDEpO1xuICB9O1xuXG4gIC8vIElzIGEgZ2l2ZW4gdmFsdWUgYW4gYXJyYXk/XG4gIC8vIERlbGVnYXRlcyB0byBFQ01BNSdzIG5hdGl2ZSBBcnJheS5pc0FycmF5XG4gIF8uaXNBcnJheSA9IG5hdGl2ZUlzQXJyYXkgfHwgZnVuY3Rpb24ob2JqKSB7XG4gICAgcmV0dXJuIHRvU3RyaW5nLmNhbGwob2JqKSA9PT0gJ1tvYmplY3QgQXJyYXldJztcbiAgfTtcblxuICAvLyBJcyBhIGdpdmVuIHZhcmlhYmxlIGFuIG9iamVjdD9cbiAgXy5pc09iamVjdCA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHZhciB0eXBlID0gdHlwZW9mIG9iajtcbiAgICByZXR1cm4gdHlwZSA9PT0gJ2Z1bmN0aW9uJyB8fCB0eXBlID09PSAnb2JqZWN0JyAmJiAhIW9iajtcbiAgfTtcblxuICAvLyBBZGQgc29tZSBpc1R5cGUgbWV0aG9kczogaXNBcmd1bWVudHMsIGlzRnVuY3Rpb24sIGlzU3RyaW5nLCBpc051bWJlciwgaXNEYXRlLCBpc1JlZ0V4cCwgaXNFcnJvci5cbiAgXy5lYWNoKFsnQXJndW1lbnRzJywgJ0Z1bmN0aW9uJywgJ1N0cmluZycsICdOdW1iZXInLCAnRGF0ZScsICdSZWdFeHAnLCAnRXJyb3InXSwgZnVuY3Rpb24obmFtZSkge1xuICAgIF9bJ2lzJyArIG5hbWVdID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgICByZXR1cm4gdG9TdHJpbmcuY2FsbChvYmopID09PSAnW29iamVjdCAnICsgbmFtZSArICddJztcbiAgICB9O1xuICB9KTtcblxuICAvLyBEZWZpbmUgYSBmYWxsYmFjayB2ZXJzaW9uIG9mIHRoZSBtZXRob2QgaW4gYnJvd3NlcnMgKGFoZW0sIElFIDwgOSksIHdoZXJlXG4gIC8vIHRoZXJlIGlzbid0IGFueSBpbnNwZWN0YWJsZSBcIkFyZ3VtZW50c1wiIHR5cGUuXG4gIGlmICghXy5pc0FyZ3VtZW50cyhhcmd1bWVudHMpKSB7XG4gICAgXy5pc0FyZ3VtZW50cyA9IGZ1bmN0aW9uKG9iaikge1xuICAgICAgcmV0dXJuIF8uaGFzKG9iaiwgJ2NhbGxlZScpO1xuICAgIH07XG4gIH1cblxuICAvLyBPcHRpbWl6ZSBgaXNGdW5jdGlvbmAgaWYgYXBwcm9wcmlhdGUuIFdvcmsgYXJvdW5kIHNvbWUgdHlwZW9mIGJ1Z3MgaW4gb2xkIHY4LFxuICAvLyBJRSAxMSAoIzE2MjEpLCBhbmQgaW4gU2FmYXJpIDggKCMxOTI5KS5cbiAgaWYgKHR5cGVvZiAvLi8gIT0gJ2Z1bmN0aW9uJyAmJiB0eXBlb2YgSW50OEFycmF5ICE9ICdvYmplY3QnKSB7XG4gICAgXy5pc0Z1bmN0aW9uID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgICByZXR1cm4gdHlwZW9mIG9iaiA9PSAnZnVuY3Rpb24nIHx8IGZhbHNlO1xuICAgIH07XG4gIH1cblxuICAvLyBJcyBhIGdpdmVuIG9iamVjdCBhIGZpbml0ZSBudW1iZXI/XG4gIF8uaXNGaW5pdGUgPSBmdW5jdGlvbihvYmopIHtcbiAgICByZXR1cm4gaXNGaW5pdGUob2JqKSAmJiAhaXNOYU4ocGFyc2VGbG9hdChvYmopKTtcbiAgfTtcblxuICAvLyBJcyB0aGUgZ2l2ZW4gdmFsdWUgYE5hTmA/IChOYU4gaXMgdGhlIG9ubHkgbnVtYmVyIHdoaWNoIGRvZXMgbm90IGVxdWFsIGl0c2VsZikuXG4gIF8uaXNOYU4gPSBmdW5jdGlvbihvYmopIHtcbiAgICByZXR1cm4gXy5pc051bWJlcihvYmopICYmIG9iaiAhPT0gK29iajtcbiAgfTtcblxuICAvLyBJcyBhIGdpdmVuIHZhbHVlIGEgYm9vbGVhbj9cbiAgXy5pc0Jvb2xlYW4gPSBmdW5jdGlvbihvYmopIHtcbiAgICByZXR1cm4gb2JqID09PSB0cnVlIHx8IG9iaiA9PT0gZmFsc2UgfHwgdG9TdHJpbmcuY2FsbChvYmopID09PSAnW29iamVjdCBCb29sZWFuXSc7XG4gIH07XG5cbiAgLy8gSXMgYSBnaXZlbiB2YWx1ZSBlcXVhbCB0byBudWxsP1xuICBfLmlzTnVsbCA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHJldHVybiBvYmogPT09IG51bGw7XG4gIH07XG5cbiAgLy8gSXMgYSBnaXZlbiB2YXJpYWJsZSB1bmRlZmluZWQ/XG4gIF8uaXNVbmRlZmluZWQgPSBmdW5jdGlvbihvYmopIHtcbiAgICByZXR1cm4gb2JqID09PSB2b2lkIDA7XG4gIH07XG5cbiAgLy8gU2hvcnRjdXQgZnVuY3Rpb24gZm9yIGNoZWNraW5nIGlmIGFuIG9iamVjdCBoYXMgYSBnaXZlbiBwcm9wZXJ0eSBkaXJlY3RseVxuICAvLyBvbiBpdHNlbGYgKGluIG90aGVyIHdvcmRzLCBub3Qgb24gYSBwcm90b3R5cGUpLlxuICBfLmhhcyA9IGZ1bmN0aW9uKG9iaiwga2V5KSB7XG4gICAgcmV0dXJuIG9iaiAhPSBudWxsICYmIGhhc093blByb3BlcnR5LmNhbGwob2JqLCBrZXkpO1xuICB9O1xuXG4gIC8vIFV0aWxpdHkgRnVuY3Rpb25zXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgLy8gUnVuIFVuZGVyc2NvcmUuanMgaW4gKm5vQ29uZmxpY3QqIG1vZGUsIHJldHVybmluZyB0aGUgYF9gIHZhcmlhYmxlIHRvIGl0c1xuICAvLyBwcmV2aW91cyBvd25lci4gUmV0dXJucyBhIHJlZmVyZW5jZSB0byB0aGUgVW5kZXJzY29yZSBvYmplY3QuXG4gIF8ubm9Db25mbGljdCA9IGZ1bmN0aW9uKCkge1xuICAgIHJvb3QuXyA9IHByZXZpb3VzVW5kZXJzY29yZTtcbiAgICByZXR1cm4gdGhpcztcbiAgfTtcblxuICAvLyBLZWVwIHRoZSBpZGVudGl0eSBmdW5jdGlvbiBhcm91bmQgZm9yIGRlZmF1bHQgaXRlcmF0ZWVzLlxuICBfLmlkZW50aXR5ID0gZnVuY3Rpb24odmFsdWUpIHtcbiAgICByZXR1cm4gdmFsdWU7XG4gIH07XG5cbiAgLy8gUHJlZGljYXRlLWdlbmVyYXRpbmcgZnVuY3Rpb25zLiBPZnRlbiB1c2VmdWwgb3V0c2lkZSBvZiBVbmRlcnNjb3JlLlxuICBfLmNvbnN0YW50ID0gZnVuY3Rpb24odmFsdWUpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gdmFsdWU7XG4gICAgfTtcbiAgfTtcblxuICBfLm5vb3AgPSBmdW5jdGlvbigpe307XG5cbiAgXy5wcm9wZXJ0eSA9IHByb3BlcnR5O1xuXG4gIC8vIEdlbmVyYXRlcyBhIGZ1bmN0aW9uIGZvciBhIGdpdmVuIG9iamVjdCB0aGF0IHJldHVybnMgYSBnaXZlbiBwcm9wZXJ0eS5cbiAgXy5wcm9wZXJ0eU9mID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgcmV0dXJuIG9iaiA9PSBudWxsID8gZnVuY3Rpb24oKXt9IDogZnVuY3Rpb24oa2V5KSB7XG4gICAgICByZXR1cm4gb2JqW2tleV07XG4gICAgfTtcbiAgfTtcblxuICAvLyBSZXR1cm5zIGEgcHJlZGljYXRlIGZvciBjaGVja2luZyB3aGV0aGVyIGFuIG9iamVjdCBoYXMgYSBnaXZlbiBzZXQgb2ZcbiAgLy8gYGtleTp2YWx1ZWAgcGFpcnMuXG4gIF8ubWF0Y2hlciA9IF8ubWF0Y2hlcyA9IGZ1bmN0aW9uKGF0dHJzKSB7XG4gICAgYXR0cnMgPSBfLmV4dGVuZE93bih7fSwgYXR0cnMpO1xuICAgIHJldHVybiBmdW5jdGlvbihvYmopIHtcbiAgICAgIHJldHVybiBfLmlzTWF0Y2gob2JqLCBhdHRycyk7XG4gICAgfTtcbiAgfTtcblxuICAvLyBSdW4gYSBmdW5jdGlvbiAqKm4qKiB0aW1lcy5cbiAgXy50aW1lcyA9IGZ1bmN0aW9uKG4sIGl0ZXJhdGVlLCBjb250ZXh0KSB7XG4gICAgdmFyIGFjY3VtID0gQXJyYXkoTWF0aC5tYXgoMCwgbikpO1xuICAgIGl0ZXJhdGVlID0gb3B0aW1pemVDYihpdGVyYXRlZSwgY29udGV4dCwgMSk7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBuOyBpKyspIGFjY3VtW2ldID0gaXRlcmF0ZWUoaSk7XG4gICAgcmV0dXJuIGFjY3VtO1xuICB9O1xuXG4gIC8vIFJldHVybiBhIHJhbmRvbSBpbnRlZ2VyIGJldHdlZW4gbWluIGFuZCBtYXggKGluY2x1c2l2ZSkuXG4gIF8ucmFuZG9tID0gZnVuY3Rpb24obWluLCBtYXgpIHtcbiAgICBpZiAobWF4ID09IG51bGwpIHtcbiAgICAgIG1heCA9IG1pbjtcbiAgICAgIG1pbiA9IDA7XG4gICAgfVxuICAgIHJldHVybiBtaW4gKyBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAobWF4IC0gbWluICsgMSkpO1xuICB9O1xuXG4gIC8vIEEgKHBvc3NpYmx5IGZhc3Rlcikgd2F5IHRvIGdldCB0aGUgY3VycmVudCB0aW1lc3RhbXAgYXMgYW4gaW50ZWdlci5cbiAgXy5ub3cgPSBEYXRlLm5vdyB8fCBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IERhdGUoKS5nZXRUaW1lKCk7XG4gIH07XG5cbiAgIC8vIExpc3Qgb2YgSFRNTCBlbnRpdGllcyBmb3IgZXNjYXBpbmcuXG4gIHZhciBlc2NhcGVNYXAgPSB7XG4gICAgJyYnOiAnJmFtcDsnLFxuICAgICc8JzogJyZsdDsnLFxuICAgICc+JzogJyZndDsnLFxuICAgICdcIic6ICcmcXVvdDsnLFxuICAgIFwiJ1wiOiAnJiN4Mjc7JyxcbiAgICAnYCc6ICcmI3g2MDsnXG4gIH07XG4gIHZhciB1bmVzY2FwZU1hcCA9IF8uaW52ZXJ0KGVzY2FwZU1hcCk7XG5cbiAgLy8gRnVuY3Rpb25zIGZvciBlc2NhcGluZyBhbmQgdW5lc2NhcGluZyBzdHJpbmdzIHRvL2Zyb20gSFRNTCBpbnRlcnBvbGF0aW9uLlxuICB2YXIgY3JlYXRlRXNjYXBlciA9IGZ1bmN0aW9uKG1hcCkge1xuICAgIHZhciBlc2NhcGVyID0gZnVuY3Rpb24obWF0Y2gpIHtcbiAgICAgIHJldHVybiBtYXBbbWF0Y2hdO1xuICAgIH07XG4gICAgLy8gUmVnZXhlcyBmb3IgaWRlbnRpZnlpbmcgYSBrZXkgdGhhdCBuZWVkcyB0byBiZSBlc2NhcGVkXG4gICAgdmFyIHNvdXJjZSA9ICcoPzonICsgXy5rZXlzKG1hcCkuam9pbignfCcpICsgJyknO1xuICAgIHZhciB0ZXN0UmVnZXhwID0gUmVnRXhwKHNvdXJjZSk7XG4gICAgdmFyIHJlcGxhY2VSZWdleHAgPSBSZWdFeHAoc291cmNlLCAnZycpO1xuICAgIHJldHVybiBmdW5jdGlvbihzdHJpbmcpIHtcbiAgICAgIHN0cmluZyA9IHN0cmluZyA9PSBudWxsID8gJycgOiAnJyArIHN0cmluZztcbiAgICAgIHJldHVybiB0ZXN0UmVnZXhwLnRlc3Qoc3RyaW5nKSA/IHN0cmluZy5yZXBsYWNlKHJlcGxhY2VSZWdleHAsIGVzY2FwZXIpIDogc3RyaW5nO1xuICAgIH07XG4gIH07XG4gIF8uZXNjYXBlID0gY3JlYXRlRXNjYXBlcihlc2NhcGVNYXApO1xuICBfLnVuZXNjYXBlID0gY3JlYXRlRXNjYXBlcih1bmVzY2FwZU1hcCk7XG5cbiAgLy8gSWYgdGhlIHZhbHVlIG9mIHRoZSBuYW1lZCBgcHJvcGVydHlgIGlzIGEgZnVuY3Rpb24gdGhlbiBpbnZva2UgaXQgd2l0aCB0aGVcbiAgLy8gYG9iamVjdGAgYXMgY29udGV4dDsgb3RoZXJ3aXNlLCByZXR1cm4gaXQuXG4gIF8ucmVzdWx0ID0gZnVuY3Rpb24ob2JqZWN0LCBwcm9wZXJ0eSwgZmFsbGJhY2spIHtcbiAgICB2YXIgdmFsdWUgPSBvYmplY3QgPT0gbnVsbCA/IHZvaWQgMCA6IG9iamVjdFtwcm9wZXJ0eV07XG4gICAgaWYgKHZhbHVlID09PSB2b2lkIDApIHtcbiAgICAgIHZhbHVlID0gZmFsbGJhY2s7XG4gICAgfVxuICAgIHJldHVybiBfLmlzRnVuY3Rpb24odmFsdWUpID8gdmFsdWUuY2FsbChvYmplY3QpIDogdmFsdWU7XG4gIH07XG5cbiAgLy8gR2VuZXJhdGUgYSB1bmlxdWUgaW50ZWdlciBpZCAodW5pcXVlIHdpdGhpbiB0aGUgZW50aXJlIGNsaWVudCBzZXNzaW9uKS5cbiAgLy8gVXNlZnVsIGZvciB0ZW1wb3JhcnkgRE9NIGlkcy5cbiAgdmFyIGlkQ291bnRlciA9IDA7XG4gIF8udW5pcXVlSWQgPSBmdW5jdGlvbihwcmVmaXgpIHtcbiAgICB2YXIgaWQgPSArK2lkQ291bnRlciArICcnO1xuICAgIHJldHVybiBwcmVmaXggPyBwcmVmaXggKyBpZCA6IGlkO1xuICB9O1xuXG4gIC8vIEJ5IGRlZmF1bHQsIFVuZGVyc2NvcmUgdXNlcyBFUkItc3R5bGUgdGVtcGxhdGUgZGVsaW1pdGVycywgY2hhbmdlIHRoZVxuICAvLyBmb2xsb3dpbmcgdGVtcGxhdGUgc2V0dGluZ3MgdG8gdXNlIGFsdGVybmF0aXZlIGRlbGltaXRlcnMuXG4gIF8udGVtcGxhdGVTZXR0aW5ncyA9IHtcbiAgICBldmFsdWF0ZSAgICA6IC88JShbXFxzXFxTXSs/KSU+L2csXG4gICAgaW50ZXJwb2xhdGUgOiAvPCU9KFtcXHNcXFNdKz8pJT4vZyxcbiAgICBlc2NhcGUgICAgICA6IC88JS0oW1xcc1xcU10rPyklPi9nXG4gIH07XG5cbiAgLy8gV2hlbiBjdXN0b21pemluZyBgdGVtcGxhdGVTZXR0aW5nc2AsIGlmIHlvdSBkb24ndCB3YW50IHRvIGRlZmluZSBhblxuICAvLyBpbnRlcnBvbGF0aW9uLCBldmFsdWF0aW9uIG9yIGVzY2FwaW5nIHJlZ2V4LCB3ZSBuZWVkIG9uZSB0aGF0IGlzXG4gIC8vIGd1YXJhbnRlZWQgbm90IHRvIG1hdGNoLlxuICB2YXIgbm9NYXRjaCA9IC8oLileLztcblxuICAvLyBDZXJ0YWluIGNoYXJhY3RlcnMgbmVlZCB0byBiZSBlc2NhcGVkIHNvIHRoYXQgdGhleSBjYW4gYmUgcHV0IGludG8gYVxuICAvLyBzdHJpbmcgbGl0ZXJhbC5cbiAgdmFyIGVzY2FwZXMgPSB7XG4gICAgXCInXCI6ICAgICAgXCInXCIsXG4gICAgJ1xcXFwnOiAgICAgJ1xcXFwnLFxuICAgICdcXHInOiAgICAgJ3InLFxuICAgICdcXG4nOiAgICAgJ24nLFxuICAgICdcXHUyMDI4JzogJ3UyMDI4JyxcbiAgICAnXFx1MjAyOSc6ICd1MjAyOSdcbiAgfTtcblxuICB2YXIgZXNjYXBlciA9IC9cXFxcfCd8XFxyfFxcbnxcXHUyMDI4fFxcdTIwMjkvZztcblxuICB2YXIgZXNjYXBlQ2hhciA9IGZ1bmN0aW9uKG1hdGNoKSB7XG4gICAgcmV0dXJuICdcXFxcJyArIGVzY2FwZXNbbWF0Y2hdO1xuICB9O1xuXG4gIC8vIEphdmFTY3JpcHQgbWljcm8tdGVtcGxhdGluZywgc2ltaWxhciB0byBKb2huIFJlc2lnJ3MgaW1wbGVtZW50YXRpb24uXG4gIC8vIFVuZGVyc2NvcmUgdGVtcGxhdGluZyBoYW5kbGVzIGFyYml0cmFyeSBkZWxpbWl0ZXJzLCBwcmVzZXJ2ZXMgd2hpdGVzcGFjZSxcbiAgLy8gYW5kIGNvcnJlY3RseSBlc2NhcGVzIHF1b3RlcyB3aXRoaW4gaW50ZXJwb2xhdGVkIGNvZGUuXG4gIC8vIE5COiBgb2xkU2V0dGluZ3NgIG9ubHkgZXhpc3RzIGZvciBiYWNrd2FyZHMgY29tcGF0aWJpbGl0eS5cbiAgXy50ZW1wbGF0ZSA9IGZ1bmN0aW9uKHRleHQsIHNldHRpbmdzLCBvbGRTZXR0aW5ncykge1xuICAgIGlmICghc2V0dGluZ3MgJiYgb2xkU2V0dGluZ3MpIHNldHRpbmdzID0gb2xkU2V0dGluZ3M7XG4gICAgc2V0dGluZ3MgPSBfLmRlZmF1bHRzKHt9LCBzZXR0aW5ncywgXy50ZW1wbGF0ZVNldHRpbmdzKTtcblxuICAgIC8vIENvbWJpbmUgZGVsaW1pdGVycyBpbnRvIG9uZSByZWd1bGFyIGV4cHJlc3Npb24gdmlhIGFsdGVybmF0aW9uLlxuICAgIHZhciBtYXRjaGVyID0gUmVnRXhwKFtcbiAgICAgIChzZXR0aW5ncy5lc2NhcGUgfHwgbm9NYXRjaCkuc291cmNlLFxuICAgICAgKHNldHRpbmdzLmludGVycG9sYXRlIHx8IG5vTWF0Y2gpLnNvdXJjZSxcbiAgICAgIChzZXR0aW5ncy5ldmFsdWF0ZSB8fCBub01hdGNoKS5zb3VyY2VcbiAgICBdLmpvaW4oJ3wnKSArICd8JCcsICdnJyk7XG5cbiAgICAvLyBDb21waWxlIHRoZSB0ZW1wbGF0ZSBzb3VyY2UsIGVzY2FwaW5nIHN0cmluZyBsaXRlcmFscyBhcHByb3ByaWF0ZWx5LlxuICAgIHZhciBpbmRleCA9IDA7XG4gICAgdmFyIHNvdXJjZSA9IFwiX19wKz0nXCI7XG4gICAgdGV4dC5yZXBsYWNlKG1hdGNoZXIsIGZ1bmN0aW9uKG1hdGNoLCBlc2NhcGUsIGludGVycG9sYXRlLCBldmFsdWF0ZSwgb2Zmc2V0KSB7XG4gICAgICBzb3VyY2UgKz0gdGV4dC5zbGljZShpbmRleCwgb2Zmc2V0KS5yZXBsYWNlKGVzY2FwZXIsIGVzY2FwZUNoYXIpO1xuICAgICAgaW5kZXggPSBvZmZzZXQgKyBtYXRjaC5sZW5ndGg7XG5cbiAgICAgIGlmIChlc2NhcGUpIHtcbiAgICAgICAgc291cmNlICs9IFwiJytcXG4oKF9fdD0oXCIgKyBlc2NhcGUgKyBcIikpPT1udWxsPycnOl8uZXNjYXBlKF9fdCkpK1xcbidcIjtcbiAgICAgIH0gZWxzZSBpZiAoaW50ZXJwb2xhdGUpIHtcbiAgICAgICAgc291cmNlICs9IFwiJytcXG4oKF9fdD0oXCIgKyBpbnRlcnBvbGF0ZSArIFwiKSk9PW51bGw/Jyc6X190KStcXG4nXCI7XG4gICAgICB9IGVsc2UgaWYgKGV2YWx1YXRlKSB7XG4gICAgICAgIHNvdXJjZSArPSBcIic7XFxuXCIgKyBldmFsdWF0ZSArIFwiXFxuX19wKz0nXCI7XG4gICAgICB9XG5cbiAgICAgIC8vIEFkb2JlIFZNcyBuZWVkIHRoZSBtYXRjaCByZXR1cm5lZCB0byBwcm9kdWNlIHRoZSBjb3JyZWN0IG9mZmVzdC5cbiAgICAgIHJldHVybiBtYXRjaDtcbiAgICB9KTtcbiAgICBzb3VyY2UgKz0gXCInO1xcblwiO1xuXG4gICAgLy8gSWYgYSB2YXJpYWJsZSBpcyBub3Qgc3BlY2lmaWVkLCBwbGFjZSBkYXRhIHZhbHVlcyBpbiBsb2NhbCBzY29wZS5cbiAgICBpZiAoIXNldHRpbmdzLnZhcmlhYmxlKSBzb3VyY2UgPSAnd2l0aChvYmp8fHt9KXtcXG4nICsgc291cmNlICsgJ31cXG4nO1xuXG4gICAgc291cmNlID0gXCJ2YXIgX190LF9fcD0nJyxfX2o9QXJyYXkucHJvdG90eXBlLmpvaW4sXCIgK1xuICAgICAgXCJwcmludD1mdW5jdGlvbigpe19fcCs9X19qLmNhbGwoYXJndW1lbnRzLCcnKTt9O1xcblwiICtcbiAgICAgIHNvdXJjZSArICdyZXR1cm4gX19wO1xcbic7XG5cbiAgICB0cnkge1xuICAgICAgdmFyIHJlbmRlciA9IG5ldyBGdW5jdGlvbihzZXR0aW5ncy52YXJpYWJsZSB8fCAnb2JqJywgJ18nLCBzb3VyY2UpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGUuc291cmNlID0gc291cmNlO1xuICAgICAgdGhyb3cgZTtcbiAgICB9XG5cbiAgICB2YXIgdGVtcGxhdGUgPSBmdW5jdGlvbihkYXRhKSB7XG4gICAgICByZXR1cm4gcmVuZGVyLmNhbGwodGhpcywgZGF0YSwgXyk7XG4gICAgfTtcblxuICAgIC8vIFByb3ZpZGUgdGhlIGNvbXBpbGVkIHNvdXJjZSBhcyBhIGNvbnZlbmllbmNlIGZvciBwcmVjb21waWxhdGlvbi5cbiAgICB2YXIgYXJndW1lbnQgPSBzZXR0aW5ncy52YXJpYWJsZSB8fCAnb2JqJztcbiAgICB0ZW1wbGF0ZS5zb3VyY2UgPSAnZnVuY3Rpb24oJyArIGFyZ3VtZW50ICsgJyl7XFxuJyArIHNvdXJjZSArICd9JztcblxuICAgIHJldHVybiB0ZW1wbGF0ZTtcbiAgfTtcblxuICAvLyBBZGQgYSBcImNoYWluXCIgZnVuY3Rpb24uIFN0YXJ0IGNoYWluaW5nIGEgd3JhcHBlZCBVbmRlcnNjb3JlIG9iamVjdC5cbiAgXy5jaGFpbiA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHZhciBpbnN0YW5jZSA9IF8ob2JqKTtcbiAgICBpbnN0YW5jZS5fY2hhaW4gPSB0cnVlO1xuICAgIHJldHVybiBpbnN0YW5jZTtcbiAgfTtcblxuICAvLyBPT1BcbiAgLy8gLS0tLS0tLS0tLS0tLS0tXG4gIC8vIElmIFVuZGVyc2NvcmUgaXMgY2FsbGVkIGFzIGEgZnVuY3Rpb24sIGl0IHJldHVybnMgYSB3cmFwcGVkIG9iamVjdCB0aGF0XG4gIC8vIGNhbiBiZSB1c2VkIE9PLXN0eWxlLiBUaGlzIHdyYXBwZXIgaG9sZHMgYWx0ZXJlZCB2ZXJzaW9ucyBvZiBhbGwgdGhlXG4gIC8vIHVuZGVyc2NvcmUgZnVuY3Rpb25zLiBXcmFwcGVkIG9iamVjdHMgbWF5IGJlIGNoYWluZWQuXG5cbiAgLy8gSGVscGVyIGZ1bmN0aW9uIHRvIGNvbnRpbnVlIGNoYWluaW5nIGludGVybWVkaWF0ZSByZXN1bHRzLlxuICB2YXIgcmVzdWx0ID0gZnVuY3Rpb24oaW5zdGFuY2UsIG9iaikge1xuICAgIHJldHVybiBpbnN0YW5jZS5fY2hhaW4gPyBfKG9iaikuY2hhaW4oKSA6IG9iajtcbiAgfTtcblxuICAvLyBBZGQgeW91ciBvd24gY3VzdG9tIGZ1bmN0aW9ucyB0byB0aGUgVW5kZXJzY29yZSBvYmplY3QuXG4gIF8ubWl4aW4gPSBmdW5jdGlvbihvYmopIHtcbiAgICBfLmVhY2goXy5mdW5jdGlvbnMob2JqKSwgZnVuY3Rpb24obmFtZSkge1xuICAgICAgdmFyIGZ1bmMgPSBfW25hbWVdID0gb2JqW25hbWVdO1xuICAgICAgXy5wcm90b3R5cGVbbmFtZV0gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGFyZ3MgPSBbdGhpcy5fd3JhcHBlZF07XG4gICAgICAgIHB1c2guYXBwbHkoYXJncywgYXJndW1lbnRzKTtcbiAgICAgICAgcmV0dXJuIHJlc3VsdCh0aGlzLCBmdW5jLmFwcGx5KF8sIGFyZ3MpKTtcbiAgICAgIH07XG4gICAgfSk7XG4gIH07XG5cbiAgLy8gQWRkIGFsbCBvZiB0aGUgVW5kZXJzY29yZSBmdW5jdGlvbnMgdG8gdGhlIHdyYXBwZXIgb2JqZWN0LlxuICBfLm1peGluKF8pO1xuXG4gIC8vIEFkZCBhbGwgbXV0YXRvciBBcnJheSBmdW5jdGlvbnMgdG8gdGhlIHdyYXBwZXIuXG4gIF8uZWFjaChbJ3BvcCcsICdwdXNoJywgJ3JldmVyc2UnLCAnc2hpZnQnLCAnc29ydCcsICdzcGxpY2UnLCAndW5zaGlmdCddLCBmdW5jdGlvbihuYW1lKSB7XG4gICAgdmFyIG1ldGhvZCA9IEFycmF5UHJvdG9bbmFtZV07XG4gICAgXy5wcm90b3R5cGVbbmFtZV0gPSBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBvYmogPSB0aGlzLl93cmFwcGVkO1xuICAgICAgbWV0aG9kLmFwcGx5KG9iaiwgYXJndW1lbnRzKTtcbiAgICAgIGlmICgobmFtZSA9PT0gJ3NoaWZ0JyB8fCBuYW1lID09PSAnc3BsaWNlJykgJiYgb2JqLmxlbmd0aCA9PT0gMCkgZGVsZXRlIG9ialswXTtcbiAgICAgIHJldHVybiByZXN1bHQodGhpcywgb2JqKTtcbiAgICB9O1xuICB9KTtcblxuICAvLyBBZGQgYWxsIGFjY2Vzc29yIEFycmF5IGZ1bmN0aW9ucyB0byB0aGUgd3JhcHBlci5cbiAgXy5lYWNoKFsnY29uY2F0JywgJ2pvaW4nLCAnc2xpY2UnXSwgZnVuY3Rpb24obmFtZSkge1xuICAgIHZhciBtZXRob2QgPSBBcnJheVByb3RvW25hbWVdO1xuICAgIF8ucHJvdG90eXBlW25hbWVdID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gcmVzdWx0KHRoaXMsIG1ldGhvZC5hcHBseSh0aGlzLl93cmFwcGVkLCBhcmd1bWVudHMpKTtcbiAgICB9O1xuICB9KTtcblxuICAvLyBFeHRyYWN0cyB0aGUgcmVzdWx0IGZyb20gYSB3cmFwcGVkIGFuZCBjaGFpbmVkIG9iamVjdC5cbiAgXy5wcm90b3R5cGUudmFsdWUgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5fd3JhcHBlZDtcbiAgfTtcblxuICAvLyBQcm92aWRlIHVud3JhcHBpbmcgcHJveHkgZm9yIHNvbWUgbWV0aG9kcyB1c2VkIGluIGVuZ2luZSBvcGVyYXRpb25zXG4gIC8vIHN1Y2ggYXMgYXJpdGhtZXRpYyBhbmQgSlNPTiBzdHJpbmdpZmljYXRpb24uXG4gIF8ucHJvdG90eXBlLnZhbHVlT2YgPSBfLnByb3RvdHlwZS50b0pTT04gPSBfLnByb3RvdHlwZS52YWx1ZTtcblxuICBfLnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiAnJyArIHRoaXMuX3dyYXBwZWQ7XG4gIH07XG5cbiAgLy8gQU1EIHJlZ2lzdHJhdGlvbiBoYXBwZW5zIGF0IHRoZSBlbmQgZm9yIGNvbXBhdGliaWxpdHkgd2l0aCBBTUQgbG9hZGVyc1xuICAvLyB0aGF0IG1heSBub3QgZW5mb3JjZSBuZXh0LXR1cm4gc2VtYW50aWNzIG9uIG1vZHVsZXMuIEV2ZW4gdGhvdWdoIGdlbmVyYWxcbiAgLy8gcHJhY3RpY2UgZm9yIEFNRCByZWdpc3RyYXRpb24gaXMgdG8gYmUgYW5vbnltb3VzLCB1bmRlcnNjb3JlIHJlZ2lzdGVyc1xuICAvLyBhcyBhIG5hbWVkIG1vZHVsZSBiZWNhdXNlLCBsaWtlIGpRdWVyeSwgaXQgaXMgYSBiYXNlIGxpYnJhcnkgdGhhdCBpc1xuICAvLyBwb3B1bGFyIGVub3VnaCB0byBiZSBidW5kbGVkIGluIGEgdGhpcmQgcGFydHkgbGliLCBidXQgbm90IGJlIHBhcnQgb2ZcbiAgLy8gYW4gQU1EIGxvYWQgcmVxdWVzdC4gVGhvc2UgY2FzZXMgY291bGQgZ2VuZXJhdGUgYW4gZXJyb3Igd2hlbiBhblxuICAvLyBhbm9ueW1vdXMgZGVmaW5lKCkgaXMgY2FsbGVkIG91dHNpZGUgb2YgYSBsb2FkZXIgcmVxdWVzdC5cbiAgaWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xuICAgIGRlZmluZSgndW5kZXJzY29yZScsIFtdLCBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBfO1xuICAgIH0pO1xuICB9XG59LmNhbGwodGhpcykpO1xuIiwid2luZG93LkhhbW1lciA9IHJlcXVpcmUoXCIuLi92ZW5kb3IvaGFtbWVyXCIpO1xyXG5yZXF1aXJlKFwiLi4vdmVuZG9yL3R3ZWVubWF4XCIpO1xyXG5cclxuXHJcbmpRdWVyeShkb2N1bWVudCkucmVhZHkoZnVuY3Rpb24gKCkge1xyXG4gICAgd2luZG93W1wiJFwiXSA9IGpRdWVyeTtcclxuXHJcbiAgICB3aW5kb3cuaXNfdG91Y2hfZGV2aWNlID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciBwcmVmaXhlcyA9ICcgLXdlYmtpdC0gLW1vei0gLW8tIC1tcy0gJy5zcGxpdCgnICcpO1xyXG4gICAgICAgIHZhciBtcSA9IGZ1bmN0aW9uIChxdWVyeSkge1xyXG4gICAgICAgICAgICByZXR1cm4gd2luZG93Lm1hdGNoTWVkaWEocXVlcnkpLm1hdGNoZXM7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgaWYgKCgnb250b3VjaHN0YXJ0JyBpbiB3aW5kb3cpIHx8IHdpbmRvdy5Eb2N1bWVudFRvdWNoICYmIGRvY3VtZW50IGluc3RhbmNlb2YgRG9jdW1lbnRUb3VjaCkge1xyXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIGluY2x1ZGUgdGhlICdoZWFydHonIGFzIGEgd2F5IHRvIGhhdmUgYSBub24gbWF0Y2hpbmcgTVEgdG8gaGVscCB0ZXJtaW5hdGUgdGhlIGpvaW5cclxuICAgICAgICAvLyBodHRwczovL2dpdC5pby92em5GSFxyXG4gICAgICAgIHZhciBxdWVyeSA9IFsnKCcsIHByZWZpeGVzLmpvaW4oJ3RvdWNoLWVuYWJsZWQpLCgnKSwgJ2hlYXJ0eicsICcpJ10uam9pbignJyk7XHJcbiAgICAgICAgcmV0dXJuIG1xKHF1ZXJ5KTtcclxuICAgIH07XHJcblxyXG4gICAgcmVxdWlyZShcIi4uL3VpL2hlbHBlcnNcIik7XHJcbiAgICByZXF1aXJlKFwiLi4vdWkvaW1hZ2VTaXplXCIpO1xyXG4gICAgcmVxdWlyZShcIi4uL3VpL21vdXNlXCIpO1xyXG4gICAgcmVxdWlyZShcIi4uL3VpL2ZpbG1zdHJpcFwiKTtcclxuICAgIHJlcXVpcmUoXCIuLi91aS9sb2FkZXJcIik7XHJcbiAgICByZXF1aXJlKFwiLi4vdWkvc2VsZWN0XCIpO1xyXG4gICAgcmVxdWlyZShcIi4uL3VpL2FjY29yZGlvblwiKTtcclxuICAgIHJlcXVpcmUoXCIuLi91aS9zY3JvbGxhYmxlRmlsbXN0cmlwXCIpO1xyXG4gICAgcmVxdWlyZShcIi4uL3VpL2RpYWxvZ1wiKTtcclxuICAgIHJlcXVpcmUoXCIuLi91aS90YWJzXCIpO1xyXG4gICAgcmVxdWlyZShcIi4uL3VpL3NsaWRlclwiKTtcclxuICAgIHJlcXVpcmUoXCIuLi91aS9zaXRlU2Nyb2xsXCIpO1xyXG4gICAgJChcIi51aS1maWxtc3RyaXBcIikudWlGaWxtc3RyaXAoKTtcclxuICAgICQoXCIudWktc2VsZWN0XCIpLnVpU2VsZWN0KCk7XHJcbiAgICAkKFwiLnVpLWFjY29yZGlvblwiKS51aUFjY29yZGlvbigpO1xyXG4gICAgJChcIi51aS10YWJzXCIpLnVpVGFicygpO1xyXG4gICAgJChcIi51aS1zbGlkZXJcIikudWlTbGlkZXIoe3Y6IDJ9KTtcclxuICAgICQoXCIudWktc2l0ZVNjcm9sbFwiKS51aVNpdGVTY3JvbGwoKTtcclxuICAgIGlmIChpc190b3VjaF9kZXZpY2UoKSkge1xyXG4gICAgICAgIC8vIGlmICgkKHdpbmRvdykud2lkdGgoKSA8IDYwMCkge1xyXG4gICAgICAgIC8vICAgICAkKFwiLnVpLXNjcm9sbGFibGVGaWxtc3RyaXBcIikudWlTY3JvbGxhYmxlRmlsbXN0cmlwKHttb2RlOiAyLCBob3ZlcjogZmFsc2UsIGJveFNjcm9sbDogZmFsc2V9KTtcclxuICAgICAgICAvLyB9IGVsc2Uge1xyXG4gICAgICAgICAgICAkKFwiLnVpLXNjcm9sbGFibGVGaWxtc3RyaXBcIikudWlTY3JvbGxhYmxlRmlsbXN0cmlwKHttb2RlOiAyLCBob3ZlcjogZmFsc2V9KTtcclxuICAgICAgICAvLyB9XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgICQoXCIudWktc2Nyb2xsYWJsZUZpbG1zdHJpcFwiKS51aVNjcm9sbGFibGVGaWxtc3RyaXAoe21vZGU6IDJ9KTtcclxuICAgIH1cclxuXHJcbiAgICAkKFwiLnVpLWZvbGRpbmdcIikuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyICRuID0gJCh0aGlzKTtcclxuICAgICAgICB2YXIgdG9wMSA9IDA7XHJcbiAgICAgICAgdmFyICRib2R5ID0gJChcImJvZHlcIik7XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIG1lbnVTZXQoKSB7XHJcbiAgICAgICAgICAgIHZhciB0b3AgPSAkKHdpbmRvdykuc2Nyb2xsVG9wKCk7XHJcbiAgICAgICAgICAgICRuLnJlbW92ZUNsYXNzKFwidWktZm9sZGluZy1zY3JvbGxlZCB1aS1mb2xkaW5nLW9wZW5lZFwiKTtcclxuICAgICAgICAgICAgaWYgKHRvcCA+IDApIHtcclxuICAgICAgICAgICAgICAgICRuLmFkZENsYXNzKFwidWktZm9sZGluZy1zY3JvbGxlZFwiKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAodG9wIDwgdG9wMSkge1xyXG4gICAgICAgICAgICAgICAgJG4uYWRkQ2xhc3MoXCJ1aS1mb2xkaW5nLW9wZW5lZFwiKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0b3AxID0gdG9wO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgJChcIi51aS1mb2xkaW5nLWljb25cIikub24oXCJjbGlja1wiLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGlmICgkbi5oYXNDbGFzcyhcInVpLWZvbGRpbmctb3BlbmVkXCIpKSB7XHJcbiAgICAgICAgICAgICAgICAkbi5yZW1vdmVDbGFzcyhcInVpLWZvbGRpbmctb3BlbmVkXCIpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgJG4uYWRkQ2xhc3MoXCJ1aS1mb2xkaW5nLW9wZW5lZFwiKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgICRuLmFkZENsYXNzKFwiZGVzdHJveVwiKS5vbih7XHJcbiAgICAgICAgICAgIGRlc3Ryb3k6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICQod2luZG93KS5vZmYoe1xyXG4gICAgICAgICAgICAgICAgICAgIHNjcm9sbDogbWVudVNldCxcclxuICAgICAgICAgICAgICAgICAgICByZXNpemU6IG1lbnVTZXRcclxuICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgc2V0VGltZW91dChtZW51U2V0LCAxMCk7XHJcbiAgICAgICAgJCh3aW5kb3cpLm9uKHtcclxuICAgICAgICAgICAgc2Nyb2xsOiBtZW51U2V0LFxyXG4gICAgICAgICAgICByZXNpemU6IG1lbnVTZXRcclxuICAgICAgICB9KVxyXG4gICAgfSk7XHJcbn0pOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIiwidmFyIHBhcnNlRGF0YSA9IHJlcXVpcmUoXCIuLi91dGlscy9wYXJzZURhdGFcIik7XG5mdW5jdGlvbiBBY2NvcmRpb24oZWxtLCBvcHRpb25zKSB7XG4gICAgdmFyICRlbG0gPSAkKGVsbSk7XG4gICAgb3B0aW9ucyA9ICQuZXh0ZW5kKHtcbiAgICAgICAgY2xvc2VPdGhlcnM6IHBhcnNlRGF0YS5nZXRCb29sZWFuKGVsbSwgXCJjbG9zZW90aGVyc1wiLCBmYWxzZSksIHNsaWRlVGltZTogMC41LCBzbGlkZTogdHJ1ZX0sIG9wdGlvbnMpO1xuXG4gICAgZnVuY3Rpb24gc2hvdygpIHtcbiAgICAgICAgJChcIi51aS1hY2NvcmRpb24tYm9keVwiLCAkZWxtKS5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBoID0gZ2V0SGVpZ2h0KCQodGhpcykpO1xuICAgICAgICAgICAgaWYgKGggPiAwKSB7XG4gICAgICAgICAgICAgICAgJCh0aGlzKS5kYXRhKFwiaGVpZ2h0XCIsIGgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgJCh0aGlzKS5wcmV2KCkudG9nZ2xlQ2xhc3MoXCJjbG9zZWRcIiwgJCh0aGlzKS5pcyhcIjpoaWRkZW5cIikpO1xuICAgICAgICB9KS5vbih7XG4gICAgICAgICAgICBsb2FkOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgJCh0aGlzKS5kYXRhKFwiaGVpZ2h0XCIsIGdldEhlaWdodCgkKHRoaXMpLmNsb3Nlc3QoXCIudWktYWNjb3JkaW9uLWJvZHlcIikpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgXCJpbWdcIik7XG4gICAgICAgICRlbG0ucmVtb3ZlQ2xhc3MoXCJzaG93XCIpLm9mZih7c2hvdzogc2hvd30pO1xuICAgICAgICAkKFwiLnVpLWFjY29yZGlvbi1oZWFkZXJcIiwgJGVsbSkuZWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAoJCh0aGlzKS5oYXNDbGFzcyhcImNsb3NlZFwiKSkge1xuICAgICAgICAgICAgICAgICQodGhpcykubmV4dCgpLmNzcyh7ZGlzcGxheTogXCJub25lXCIsIGhlaWdodDogXCIwcHhcIn0pO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAkKHRoaXMpLm5leHQoKS5zaG93KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGlmICgkZWxtLmNsb3Nlc3QoXCI6aGlkZGVuXCIpLmxlbmd0aCAmJiAhJGVsbS5oYXNDbGFzcyhcInNob3dcIikpIHtcbiAgICAgICAgJGVsbS5hZGRDbGFzcyhcInNob3dcIikub24oe1xuICAgICAgICAgICAgc2hvdzogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGlmICgkZWxtLmNsb3Nlc3QoXCI6aGlkZGVuXCIpLmxlbmd0aCA9PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHNob3coKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHNob3coKTtcbiAgICB9XG5cblxuICAgIGZ1bmN0aW9uIGdldEhlaWdodCgkYm9keSkge1xuICAgICAgICB2YXIgJGMxID0gJGJvZHkuY2xvbmUoKS5jc3Moe1xuICAgICAgICAgICAgdmlzaWJpbGl0eTogXCJoaWRkZW5cIiwgcG9zaXRpb246IFwicmVsYXRpdmVcIixcbiAgICAgICAgICAgIGRpc3BsYXk6IFwiYmxvY2tcIiwgbGVmdDogXCItOTk5OTlweFwiLCBoZWlnaHQ6IFwiXCJcbiAgICAgICAgfSkuaW5zZXJ0QWZ0ZXIoJGJvZHkpO1xuICAgICAgICB2YXIgaCA9ICRjMS5oZWlnaHQoKTtcbiAgICAgICAgJGMxLnJlbW92ZSgpO1xuICAgICAgICByZXR1cm4gaDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiB1cGRhdGUoJGJvZHksIGgpIHtcbiAgICAgICAgaWYgKGggPT0gMCkge1xuICAgICAgICAgICAgJGJvZHkuaGlkZSgpLnRyaWdnZXIoXCJ1aS5hY2NvcmRpb24uaGlkZUVuZFwiKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICRib2R5LmNzcyh7aGVpZ2h0OiBcIlwifSkudHJpZ2dlcihcInVpLmFjY29yZGlvbi5zaG93RW5kXCIpO1xuICAgICAgICAgICAgJGJvZHkuZmluZChcIi5zaG93XCIpLnRyaWdnZXIoXCJzaG93XCIpO1xuICAgICAgICB9XG4gICAgfVxuXG5cbiAgICBmdW5jdGlvbiB1cGRhdGVIZWlnaHQoJGJvZHkpIHtcbiAgICAgICAgdmFyIGggPSBnZXRIZWlnaHQoJGJvZHkpO1xuICAgICAgICBpZiAoaCA+IDApIHtcbiAgICAgICAgICAgICRib2R5LmRhdGEoXCJoZWlnaHRcIiwgaCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiB0bygkYm9keSwgaCkge1xuICAgICAgICAkYm9keS5jc3Moe2Rpc3BsYXk6IFwiYmxvY2tcIn0pO1xuICAgICAgICB2YXIgaGFzSGVpZ2h0ID0gISEkYm9keS5kYXRhKFwiaGVpZ2h0XCIpO1xuICAgICAgICBpZiAob3B0aW9ucy5zbGlkZSAmJiBoYXNIZWlnaHQpIHtcbiAgICAgICAgICAgIFR3ZWVuTGl0ZS50bygkYm9keSwgb3B0aW9ucy5zbGlkZVRpbWUsIHtcbiAgICAgICAgICAgICAgICBjc3M6IHtoZWlnaHQ6IGggKyBcInB4XCJ9LCBlYXNlOiBQb3dlcjIuZWFzZU91dCwgb25Db21wbGV0ZTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICB1cGRhdGUoJGJvZHksIGgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdXBkYXRlKCRib2R5LCBoKTtcbiAgICAgICAgfVxuXG4gICAgfVxuXG5cbiAgICAkZWxtLm9uKHtcbiAgICAgICAgY2xpY2s6IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICBpZiAoJChlLnRhcmdldCkuY2xvc2VzdChcImEsYnV0dG9uXCIpLnNpemUoKSA+IDApIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoJCh0aGlzKS5jbG9zZXN0KFwiLnVpLWFjY29yZGlvblwiKS5nZXQoMCkgIT0gJGVsbS5nZXQoMCkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgJGJvZHkgPSAkKHRoaXMpLm5leHQoKSxcbiAgICAgICAgICAgICAgICBjbG9zZWQgPSAkKHRoaXMpLmhhc0NsYXNzKFwiY2xvc2VkXCIpLFxuICAgICAgICAgICAgICAgIGg7XG4gICAgICAgICAgICBpZiAoY2xvc2VkKSB7XG4gICAgICAgICAgICAgICAgaCA9ICRib2R5LmRhdGEoXCJoZWlnaHRcIik7XG4gICAgICAgICAgICAgICAgaWYgKGggPT0gMCkge1xuICAgICAgICAgICAgICAgICAgICB1cGRhdGVIZWlnaHQoJGJvZHkpO1xuICAgICAgICAgICAgICAgICAgICBoID0gJGJvZHkuZGF0YShcImhlaWdodFwiKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgJCh0aGlzKS5yZW1vdmVDbGFzcyhcImNsb3NlZFwiKTtcbiAgICAgICAgICAgICAgICAkKHRoaXMpLm5leHQoKS50cmlnZ2VyKFwidWkuYWNjb3JkaW9uLnNob3dTdGFydFwiKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdXBkYXRlSGVpZ2h0KCRib2R5KTtcbiAgICAgICAgICAgICAgICAkKHRoaXMpLmFkZENsYXNzKFwiY2xvc2VkXCIpO1xuICAgICAgICAgICAgICAgICQodGhpcykubmV4dCgpLnRyaWdnZXIoXCJ1aS5hY2NvcmRpb24uaGlkZVN0YXJ0XCIpO1xuICAgICAgICAgICAgICAgIGggPSAwO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdG8oJGJvZHksIGgpO1xuICAgICAgICAgICAgaWYgKG9wdGlvbnMuY2xvc2VPdGhlcnMgJiYgaCA+IDApIHtcbiAgICAgICAgICAgICAgICAkZWxtLmZpbmQoXCIudWktYWNjb3JkaW9uLWhlYWRlcjpub3QoLmNsb3NlZClcIikubm90KHRoaXMpLmVhY2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICB0bygkKHRoaXMpLmFkZENsYXNzKFwiY2xvc2VkXCIpLm5leHQoKSwgMCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LCBcIi51aS1hY2NvcmRpb24taGVhZGVyXCIpO1xuXG4gICAgJGVsbS5kYXRhKFwidWlcIiwge30pO1xuXG59XG5cbiQuZm4udWlBY2NvcmRpb24gPSBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgIHJldHVybiAkKHRoaXMpLmVhY2goZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoJCh0aGlzKS5kYXRhKFwidWlcIikpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBuZXcgQWNjb3JkaW9uKHRoaXMsIG9wdGlvbnMpO1xuICAgIH0pO1xufTsiLCIkLmZuLnVpRGlhbG9nID0gZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICBvcHRpb25zID0gJC5leHRlbmQoe1xuICAgICAgICBvdmVybGF5Q2xvc2U6IHRydWUsXG4gICAgICAgIHJlc2l6ZTogZmFsc2UsXG4gICAgICAgIG1vZGFsOiB0cnVlLFxuICAgICAgICBtaW5HYXA6IDE1XG4gICAgfSwgb3B0aW9ucyk7XG4gICAgcmV0dXJuIHRoaXMuZWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBlbG0gPSB0aGlzO1xuICAgICAgICB2YXIgJHdpbmRvdyA9ICQod2luZG93KTtcbiAgICAgICAgdmFyICRkb2N1bWVudCA9ICQoZG9jdW1lbnQpO1xuICAgICAgICB2YXIgZGlhbG9nID0gJChcIjxkaXYgY2xhc3M9J3VpLWRpYWxvZyc+XCIpO1xuICAgICAgICBpZiAob3B0aW9ucy5tb2RhbCkge1xuICAgICAgICAgICAgdmFyIG92ZXJsYXkgPSAkKCc8ZGl2IGNsYXNzPVwidWktZGlhbG9nLW92ZXJsYXlcIj4nKS5hcHBlbmRUbyhcImJvZHlcIik7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoJChlbG0pLmRhdGEoXCJ3aWR0aFwiKSkge1xuICAgICAgICAgICAgb3B0aW9ucy53aWR0aCA9IHBhcnNlSW50KCQoZWxtKS5kYXRhKFwid2lkdGhcIiksIDEwKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoJChlbG0pLmRhdGEoXCJoZWlnaHRcIikpIHtcbiAgICAgICAgICAgIG9wdGlvbnMuaGVpZ2h0ID0gcGFyc2VJbnQoJChlbG0pLmRhdGEoXCJoZWlnaHRcIiksIDEwKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoJChlbG0pLmRhdGEoXCJncm93XCIpKSB7XG4gICAgICAgICAgICBvcHRpb25zLmdyb3cgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGlmIChvcHRpb25zLm1vZGFsKSB7XG4gICAgICAgICAgICBvdmVybGF5LmJpbmRUYXAoKS5vbih7XG4gICAgICAgICAgICAgICAgY2xpY2s6IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9wdGlvbnMub3ZlcmxheUNsb3NlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkKGVsbSkudHJpZ2dlcihcImRpYWxvZy5jbG9zZVwiKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpYWxvZy5hZGRDbGFzcyhcInVpLWRpYWxvZy1kZWFjdGl2YXRlXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGlhbG9nLnJlbW92ZUNsYXNzKFwidWktZGlhbG9nLWRlYWN0aXZhdGVcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9LCAxMDApO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBkaWFsb2cuYWRkQ2xhc3MoXCJ1aS1kaWFsb2ctZmxvYXRcIik7XG4gICAgICAgIH1cblxuXG4vLyAgICAgICAgJChcImJvZHlcIikuY3NzKHtvdmVyZmxvdzpcImhpZGRlblwifSk7XG4gICAgICAgIHZhciB3aWR0aCA9IG9wdGlvbnMud2lkdGggfHwgTWF0aC5mbG9vcigkd2luZG93LndpZHRoKCkgKiAwLjgpO1xuICAgICAgICB2YXIgaGVpZ2h0ID0gb3B0aW9ucy5oZWlnaHQgfHwgTWF0aC5mbG9vcigkd2luZG93LmhlaWdodCgpICogMC44KTtcblxuICAgICAgICBpZiAoJHdpbmRvdy53aWR0aCgpIDwgd2lkdGggKyBvcHRpb25zLm1pbkdhcCAqIDIpIHtcbiAgICAgICAgICAgIHdpZHRoID0gJHdpbmRvdy53aWR0aCgpIC0gb3B0aW9ucy5taW5HYXAgKiAyO1xuICAgICAgICB9XG4gICAgICAgIGlmICgkd2luZG93LmhlaWdodCgpIDwgaGVpZ2h0ICsgb3B0aW9ucy5taW5HYXAgKiAyKSB7XG4gICAgICAgICAgICBoZWlnaHQgPSAkd2luZG93LmhlaWdodCgpIC0gb3B0aW9ucy5taW5HYXAgKiAyO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGxlZnQgPSAoJHdpbmRvdy53aWR0aCgpIC0gd2lkdGgpIC8gMjtcblxuICAgICAgICB2YXIgdG9wO1xuXG4gICAgICAgIGlmICgkd2luZG93LmhlaWdodCgpID4gaGVpZ2h0KSB7XG4gICAgICAgICAgICB0b3AgPSAoJHdpbmRvdy5oZWlnaHQoKSAtIGhlaWdodCkgLyAyICsgJHdpbmRvdy5zY3JvbGxUb3AoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRvcCA9IG9wdGlvbnMubWluR2FwO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRvcCA8IDApIHtcbiAgICAgICAgICAgIHRvcCA9IDA7XG4gICAgICAgIH1cblxuICAgICAgICAkKFwiYm9keSAudWktZGlhbG9nXCIpLmxhc3QoKS5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBwID0gJCh0aGlzKS5vZmZzZXQoKTtcbiAgICAgICAgICAgIGlmIChwLnRvcCA9PSB0b3ApIHtcbiAgICAgICAgICAgICAgICB0b3AgKz0gMjA7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAocC5sZWZ0ID09IGxlZnQpIHtcbiAgICAgICAgICAgICAgICBsZWZ0ICs9IDIwO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICBkaWFsb2cuYXBwZW5kVG8oXCJib2R5XCIpLmNzcyh7XG4gICAgICAgICAgICB3aWR0aDogd2lkdGggKyBcInB4XCIsXG4gICAgICAgICAgICBoZWlnaHQ6IGhlaWdodCArIFwicHhcIixcbiAgICAgICAgICAgIGxlZnQ6IGxlZnQgKyBcInB4XCIsXG4gICAgICAgICAgICB0b3A6IHRvcCArIFwicHhcIixcbiAgICAgICAgICAgIHZpc2liaWxpdHk6IFwiaGlkZGVuXCJcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKG9wdGlvbnMuZ3Jvdykge1xuICAgICAgICAgICAgZGlhbG9nLmNzcyh7aGVpZ2h0OiBcImF1dG9cIiwgbWluSGVpZ2h0OiBoZWlnaHQgKyBcInB4XCJ9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIHdpbmRvd1Jlc2l6ZSgpIHtcbiAgICAgICAgICAgIGlmIChvcHRpb25zLm1vZGFsKSB7XG4gICAgICAgICAgICAgICAgb3ZlcmxheS5jc3Moe3dpZHRoOiAkd2luZG93LndpZHRoKCkgKyBcInB4XCIsIGhlaWdodDogJGRvY3VtZW50LmhlaWdodCgpICsgXCJweFwifSk7XG4gICAgICAgICAgICB9XG4vLyAgICAgICAgICAgIGRpYWxvZy5jc3Moe2xlZnQ6ICgoJHdpbmRvdy53aWR0aCgpIC0gd2lkdGgpIC8gMikgKyBcInB4XCJ9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGRvY3VtZW50S2V5ZG93bihlKSB7XG4gICAgICAgICAgICBpZiAob3B0aW9ucy5vdmVybGF5Q2xvc2UgJiYgZS53aGljaCA9PSAyNykge1xuICAgICAgICAgICAgICAgICQoXCIudWktZGlhbG9nOmxhc3RcIikuY2hpbGRyZW4oKS50cmlnZ2VyKFwiZGlhbG9nLmNsb3NlXCIpO1xuICAgICAgICAgICAgICAgIGUuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuXG4gICAgICAgIGRpYWxvZy5hcHBlbmQoZWxtKTtcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgZEhlaWdodCA9IGRpYWxvZy5oZWlnaHQoKTtcbiAgICAgICAgICAgIGlmICgkd2luZG93LmhlaWdodCgpID4gZEhlaWdodCkge1xuICAgICAgICAgICAgICAgIHRvcCA9ICgkd2luZG93LmhlaWdodCgpIC0gZEhlaWdodCkgLyAyICsgJHdpbmRvdy5zY3JvbGxUb3AoKTtcbiAgICAgICAgICAgICAgICBkaWFsb2cuY3NzKHtcbiAgICAgICAgICAgICAgICAgICAgdG9wOiB0b3AgKyBcInB4XCIsXG4gICAgICAgICAgICAgICAgICAgIHZpc2liaWxpdHk6IFwiXCJcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZGlhbG9nLmNzcyh7XG4gICAgICAgICAgICAgICAgICAgIHZpc2liaWxpdHk6IFwiXCJcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgMjApO1xuXG4gICAgICAgIGlmIChvcHRpb25zLnJlc2l6ZSkge1xuICAgICAgICAgICAgZGlhbG9nLnVpUmVzaXplKHtpbnZlcnQ6IGZhbHNlfSk7XG4gICAgICAgIH1cblxuICAgICAgICBkaWFsb2cuZmluZChcIi51aS1kaWFsb2ctaGVhZGVyXCIpLm9uTW91c2Uoe1xuICAgICAgICAgICAgXCJtb3VzZS5zdGFydFwiOiBmdW5jdGlvbiAoZSwgcG9zKSB7XG4gICAgICAgICAgICAgICAgcG9zLmRhdGEueCA9IGRpYWxvZy5wb3NpdGlvbigpLmxlZnQ7XG4gICAgICAgICAgICAgICAgcG9zLmRhdGEueSA9IGRpYWxvZy5wb3NpdGlvbigpLnRvcDtcbiAgICAgICAgICAgICAgICBwb3MucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICBpZiAoZGlhbG9nLmZpbmQoXCIudWktZGlhbG9nLWhlYWRlclwiKS5nZXQoMCkgPT0gZS50YXJnZXQpIHtcbiAgICAgICAgICAgICAgICAgICAgcG9zLmRhdGEubW92ZSA9IHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwibW91c2UubW92ZVwiOiBmdW5jdGlvbiAoZSwgcG9zKSB7XG4gICAgICAgICAgICAgICAgdmFyIGRpZmYgPSBwb3MuZGlmZigpO1xuICAgICAgICAgICAgICAgIGlmIChwb3MuZGF0YS5tb3ZlKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciB0MSA9IHBvcy5kYXRhLnkgKyBkaWZmLnk7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0MSA8IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHQxID0gMDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBkaWFsb2cuY3NzKHtsZWZ0OiBwb3MuZGF0YS54ICsgZGlmZi54ICsgXCJweFwiLCB0b3A6IHQxICsgXCJweFwifSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgJCh3aW5kb3cpLm9uKFwicmVzaXplXCIsIHdpbmRvd1Jlc2l6ZSk7XG4gICAgICAgICQod2luZG93KS5vbihcImtleWRvd25cIiwgZG9jdW1lbnRLZXlkb3duKTtcblxuICAgICAgICB3aW5kb3dSZXNpemUoKTtcbiAgICAgICAgJChlbG0pLmJpbmQoXCJkaWFsb2cuY2xvc2VcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJCh3aW5kb3cpLm9mZihcInJlc2l6ZVwiLCB3aW5kb3dSZXNpemUpO1xuICAgICAgICAgICAgJCh3aW5kb3cpLm9mZihcImtleWRvd25cIiwgZG9jdW1lbnRLZXlkb3duKTtcbiAgICAgICAgICAgIGRpYWxvZy5oaWRlKCk7XG4gICAgICAgICAgICAkKGVsbSkudHJpZ2dlcihcImRpYWxvZy5jbG9zZWRcIik7XG4gICAgICAgICAgICBkaWFsb2cuZGVzdHJveSgpO1xuICAgICAgICAgICAgaWYgKG9wdGlvbnMubW9kYWwpIHtcbiAgICAgICAgICAgICAgICBvdmVybGF5LmRlc3Ryb3koKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSkuYWRkQ2xhc3MoXCJ1aS1kaWFsb2ctY29udGVudFwiKTtcblxuICAgICAgICAkKFwiLnVpLWRpYWxvZy1jbG9zZSwgLnVpLWRpYWxvZy1jYW5jZWxcIiwgZGlhbG9nKS5iaW5kVGFwKCkuY2xpY2soZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJChlbG0pLnRyaWdnZXIoXCJkaWFsb2cuY2xvc2VcIik7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH0pO1xuICAgIH0pO1xufTtcbiIsInZhciBfID0gcmVxdWlyZShcInVuZGVyc2NvcmVcIik7XG4kLmZuLnVpRmlsbXN0cmlwID0gZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICBvcHRpb25zID0gJC5leHRlbmQoe3Njcm9sbFRpbWVvdXQ6IDcwMCwgYXV0b1BsYXk6ICQodGhpcykuZGF0YShcImF1dG9wbGF5XCIpfSwgb3B0aW9ucyk7XG4gICAgcmV0dXJuICQodGhpcykuZWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBlbG0gPSB0aGlzLCAkZWxtID0gJChlbG0pO1xuICAgICAgICB2YXIgJGNvbnRlbnQgPSAkKFwiLnVpLWZpbG1zdHJpcC1zY3JvbGxcIiwgZWxtKTtcbiAgICAgICAgdmFyIGNoaWxkV2lkdGggPSAkY29udGVudC5jaGlsZHJlbigpLmVxKDApLndpZHRoKCk7XG4gICAgICAgIHZhciBtaW5XaWR0aCA9IDA7XG4gICAgICAgIGlmICgkZWxtLmRhdGEoXCJtaW53aWR0aFwiKSkge1xuICAgICAgICAgICAgbWluV2lkdGggPSAkZWxtLmRhdGEoXCJtaW53aWR0aFwiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciB3ID0gMCwgaCA9IDAsIHR3ID0gMCwgY0NvbnRlbnQgPSBudWxsO1xuXG4gICAgICAgIGNDb250ZW50ID0gJGNvbnRlbnQuY2xvbmUodHJ1ZSkuYWRkQ2xhc3MoXCJjbG9uZWRcIik7XG4gICAgICAgIGNDb250ZW50LmhpZGUoKS5jaGlsZHJlbigpO1xuICAgICAgICAkY29udGVudC5hZnRlcihjQ29udGVudCk7XG4gICAgICAgIGZ1bmN0aW9uIHVwZGF0ZVdpZHRoKCkge1xuICAgICAgICAgICAgaWYgKCEkZWxtLmZpbmQoXCIudWktZmlsbXN0cmlwLWNvbnRlbnRcIikuZ2V0KDApLm93bmVyRG9jdW1lbnQuZGVmYXVsdFZpZXcpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIWNoaWxkV2lkdGgpIHtcbiAgICAgICAgICAgICAgICBjaGlsZFdpZHRoID0gJGNvbnRlbnQuY2hpbGRyZW4oKS5lcSgwKS53aWR0aCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIGN3ID0gJGVsbS5maW5kKFwiLnVpLWZpbG1zdHJpcC1jb250ZW50XCIpLndpZHRoKCksXG4gICAgICAgICAgICAgICAgY3MgPSAkY29udGVudC5jaGlsZHJlbigpLnNpemUoKTtcbiAgICAgICAgICAgIHZhciBhMSA9IDA7XG4gICAgICAgICAgICBpZiAoY2hpbGRXaWR0aCA8IGN3KSB7XG4gICAgICAgICAgICAgICAgYTEgPSBNYXRoLmZsb29yKGN3IC8gTWF0aC5yb3VuZChjdyAvIGNoaWxkV2lkdGgpKVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGExICogY3MgPCBjdyAmJiBjcyA+IDAgJiYgYTEgPiAwKSB7XG4gICAgICAgICAgICAgICAgYTEgPSBNYXRoLnJvdW5kKGN3IC8gY3MpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKG1pbldpZHRoID4gMCAmJiBhMSA8IG1pbldpZHRoICYmIG1pbldpZHRoIDwgY3cgJiYgYTEgPiAwKSB7XG4gICAgICAgICAgICAgICAgYTEgPSBNYXRoLnJvdW5kKGN3IC8gTWF0aC5mbG9vcihjdyAvIG1pbldpZHRoKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoYTEgPD0gMCkge1xuICAgICAgICAgICAgICAgIGExID0gY3c7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAkY29udGVudC5jaGlsZHJlbigpLmNzcyh7d2lkdGg6IGExICsgXCJweFwifSk7XG4gICAgICAgICAgICBjQ29udGVudC5jaGlsZHJlbigpLmNzcyh7d2lkdGg6IGExICsgXCJweFwifSk7XG4gICAgICAgICAgICB3ID0gMDtcbiAgICAgICAgICAgIHR3ID0gMDtcbiAgICAgICAgICAgIGggPSAwO1xuICAgICAgICAgICAgJGNvbnRlbnQuY2hpbGRyZW4oKS5jc3Moe2hlaWdodDogXCJcIn0pLmVhY2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciB0MSA9ICQodGhpcykub3V0ZXJXaWR0aCh0cnVlKTtcbiAgICAgICAgICAgICAgICBpZiAodDEgPiB0dykge1xuICAgICAgICAgICAgICAgICAgICB0dyA9IHQxO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB2YXIgaDEgPSAkKHRoaXMpLm91dGVySGVpZ2h0KHRydWUpO1xuICAgICAgICAgICAgICAgIGlmIChoMSA+IGgpIHtcbiAgICAgICAgICAgICAgICAgICAgaCA9IGgxO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB3ICs9IHQxO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICRjb250ZW50LmNzcyh7d2lkdGg6IHcgKyBcInB4XCJ9KTtcbiAgICAgICAgICAgIGNDb250ZW50LmNzcyh7d2lkdGg6IHcgKyBcInB4XCJ9KTtcbiAgICAgICAgICAgICRlbG0uZmluZChcIi51aS1maWxtc3RyaXAtY29udGVudFwiKS5jc3Moe2hlaWdodDogaCArIFwicHhcIn0pO1xuXG4gICAgICAgICAgICB2YXIgbDEgPSAkY29udGVudC5wb3NpdGlvbigpLmxlZnQ7XG4gICAgICAgICAgICB2YXIgbDIgPSBjQ29udGVudC5wb3NpdGlvbigpLmxlZnQ7XG4gICAgICAgICAgICBpZiAobDEgPiBsMikge1xuICAgICAgICAgICAgICAgIGNDb250ZW50LmNzcyh7bGVmdDogbDEgLSB3ICsgXCJweFwifSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNDb250ZW50LmNzcyh7bGVmdDogbDEgKyB3ICsgXCJweFwifSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjQ29udGVudC5zaG93KCk7XG4gICAgICAgICAgICB1cGRhdGVYKDApO1xuICAgICAgICB9XG5cbiAgICAgICAgJGNvbnRlbnQuZmluZChcImltZ1wiKS5sb2FkKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHVwZGF0ZVdpZHRoKCk7XG4gICAgICAgIH0pLmltYWdlU2l6ZSgpO1xuXG5cbiAgICAgICAgdmFyIHggPSAwLCB0MSA9IDA7XG5cbiAgICAgICAgZnVuY3Rpb24gdXBkYXRlWChzcGVlZCkge1xuICAgICAgICAgICAgaWYgKF8uaXNVbmRlZmluZWQoc3BlZWQpKSB7XG4gICAgICAgICAgICAgICAgc3BlZWQgPSBvcHRpb25zLnNjcm9sbFRpbWVvdXQgLyAxMDAwO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgVHdlZW5MaXRlLmtpbGxUd2VlbnNPZigkY29udGVudCk7XG4gICAgICAgICAgICBUd2VlbkxpdGUua2lsbFR3ZWVuc09mKGNDb250ZW50KTtcbiAgICAgICAgICAgIHZhciB3MCA9ICRjb250ZW50LmNoaWxkcmVuKCkuc2l6ZSgpO1xuICAgICAgICAgICAgdmFyIHcxID0gTWF0aC5yb3VuZCgkZWxtLmZpbmQoXCIudWktZmlsbXN0cmlwLWNvbnRlbnRcIikud2lkdGgoKSAvIHR3KTtcbiAgICAgICAgICAgIGlmICh4IDwgLXcwKSB7XG4gICAgICAgICAgICAgICAgeCA9IC13MDtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoeCA+IHcxKSB7XG4gICAgICAgICAgICAgICAgeCA9IHcxO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIGwgPSB0dyAqIHgsIGwyLCBsMSA9ICRjb250ZW50LnBvc2l0aW9uKCkubGVmdDtcbiAgICAgICAgICAgIGlmIChsID49IDAgJiYgbDEgPj0gMCkge1xuICAgICAgICAgICAgICAgIGwyID0gdHcgKiAoeCAtIHcwKTtcbiAgICAgICAgICAgICAgICBjQ29udGVudC5jc3Moe2xlZnQ6IGwxIC0gdyArIFwicHhcIn0pO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBsMiA9IHR3ICogKHggKyB3MCk7XG4gICAgICAgICAgICAgICAgY0NvbnRlbnQuY3NzKHtsZWZ0OiBsMSArIHcgKyBcInB4XCJ9KTtcbiAgICAgICAgICAgIH1cblxuXG4gICAgICAgICAgICBUd2VlbkxpdGUudG8oJGNvbnRlbnRbMF0sIHNwZWVkLCB7XG4gICAgICAgICAgICAgICAgY3NzOiB7bGVmdDogbCArIFwicHhcIn0sXG4gICAgICAgICAgICAgICAgZWFzZTogUG93ZXIyLmVhc2VJbiwgb25Db21wbGV0ZTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoeCArIHcwID09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHggPSAwO1xuICAgICAgICAgICAgICAgICAgICAgICAgJGNvbnRlbnQuY3NzKHtsZWZ0OiBsMiArIFwicHhcIn0pO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHggLSB3MSA9PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB4ID0gdzEgLSB3MDtcbiAgICAgICAgICAgICAgICAgICAgICAgICRjb250ZW50LmNzcyh7bGVmdDogbDIgKyBcInB4XCJ9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBUd2VlbkxpdGUudG8oY0NvbnRlbnRbMF0sIHNwZWVkLCB7XG4gICAgICAgICAgICAgICAgY3NzOiB7bGVmdDogbDIgKyBcInB4XCJ9LFxuICAgICAgICAgICAgICAgIGVhc2U6IFBvd2VyMi5lYXNlSW4sIG9uQ29tcGxldGU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgbCA9ICRjb250ZW50LnBvc2l0aW9uKCkubGVmdDtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGwgPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjQ29udGVudC5jc3Moe2xlZnQ6IGwgLSB3ICsgXCJweFwifSk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjQ29udGVudC5jc3Moe2xlZnQ6IGwgKyB3ICsgXCJweFwifSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGZhbHNlKSB7XG4gICAgICAgICAgICAkZWxtLmZpbmQoXCIudWktZmlsbXN0cmlwLWNvbnRlbnRcIikub24oXCJtb3VzZXdoZWVsIERPTU1vdXNlU2Nyb2xsXCIsIGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAgICAgdmFyIGRlbHRhID0gZS5vcmlnaW5hbEV2ZW50LmRldGFpbCA8IDAgfHwgZS5vcmlnaW5hbEV2ZW50LndoZWVsRGVsdGEgPiAwID8gMSA6IC0xO1xuICAgICAgICAgICAgICAgIGlmICh0MSA8ICQubm93KCkgLSBvcHRpb25zLnNjcm9sbFRpbWVvdXQpIHtcbiAgICAgICAgICAgICAgICAgICAgeCArPSBkZWx0YTtcbiAgICAgICAgICAgICAgICAgICAgdXBkYXRlWCgpO1xuICAgICAgICAgICAgICAgICAgICB0MSA9ICQubm93KCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgSGFtbWVyKCRlbG0uZmluZChcIi51aS1maWxtc3RyaXAtbGVmdFwiKS5nZXQoMCkpLm9uKFwidGFwXCIsIGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICB4Kys7XG4gICAgICAgICAgICB1cGRhdGVYKCk7XG4gICAgICAgIH0pO1xuICAgICAgICBIYW1tZXIoJGVsbS5maW5kKFwiLnVpLWZpbG1zdHJpcC1yaWdodFwiKS5nZXQoMCkpLm9uKFwidGFwXCIsIGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICB4LS07XG4gICAgICAgICAgICB1cGRhdGVYKCk7XG4gICAgICAgIH0pO1xuICAgICAgICBmdW5jdGlvbiBkcmFnTW92ZShsMSkge1xuICAgICAgICAgICAgJGNvbnRlbnQuY3NzKHtsZWZ0OiB0dyAqIHggKyBsMSArIFwicHhcIn0pO1xuICAgICAgICAgICAgaWYgKGwxID4gMCkge1xuICAgICAgICAgICAgICAgIGNDb250ZW50LmNzcyh7bGVmdDogdHcgKiB4ICsgbDEgLSB3ICsgXCJweFwifSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNDb250ZW50LmNzcyh7bGVmdDogdHcgKiB4ICsgbDEgKyB3ICsgXCJweFwifSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBiaW5kRHJhZ3MoZWxtKSB7XG4gICAgICAgICAgICBIYW1tZXIoZWxtKS5vbihcImRyYWdzdGFydFwiLCBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgICAgIGlmIChvcHRpb25zLmF1dG9QbGF5KSB7XG4gICAgICAgICAgICAgICAgICAgIGNsZWFySW50ZXJ2YWwoYXBJbnRlcnZhbCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSkub24oXCJkcmFncmlnaHRcIiwgZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgICAgICBlLmdlc3R1cmUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICBkcmFnTW92ZShlLmdlc3R1cmUuZGVsdGFYKTtcbiAgICAgICAgICAgIH0pLm9uKFwiZHJhZ2xlZnRcIiwgZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgICAgICBlLmdlc3R1cmUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICBkcmFnTW92ZShlLmdlc3R1cmUuZGVsdGFYKTtcbiAgICAgICAgICAgIH0pLm9uKFwiZHJhZ2VuZFwiLCBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgICAgIHZhciBsID0gJGNvbnRlbnQucG9zaXRpb24oKS5sZWZ0O1xuICAgICAgICAgICAgICAgIHggPSBNYXRoLnJvdW5kKGwgLyB0dyk7XG4gICAgICAgICAgICAgICAgdXBkYXRlWCgpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAob3B0aW9ucy5pc1RwbCAhPT0gdHJ1ZSl7XG4gICAgICAgICAgICBiaW5kRHJhZ3MoJGNvbnRlbnQuZ2V0KDApKTtcbiAgICAgICAgICAgIGJpbmREcmFncyhjQ29udGVudC5nZXQoMCkpO1xuICAgICAgICB9XG5cblxuICAgICAgICB2YXIgYXBJbnRlcnZhbDtcbiAgICAgICAgaWYgKG9wdGlvbnMuYXV0b1BsYXkgJiYgb3B0aW9ucy5pc1RwbCAhPT0gdHJ1ZSkge1xuICAgICAgICAgICAgZnVuY3Rpb24gYXV0b01vdmUoKSB7XG4gICAgICAgICAgICAgICAgeC0tO1xuICAgICAgICAgICAgICAgIHVwZGF0ZVgoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGFwSW50ZXJ2YWwgPSBzZXRJbnRlcnZhbChhdXRvTW92ZSwgb3B0aW9ucy5hdXRvUGxheSk7XG5cbi8vICAgICAgICAgICAgJGVsbS5vbih7XG4vLyAgICAgICAgICAgICAgICBtb3VzZWVudGVyOiBmdW5jdGlvbiAoKSB7XG4vL1xuLy8gICAgICAgICAgICAgICAgfSxcbi8vICAgICAgICAgICAgICAgIG1vdXNlbGVhdmU6IGZ1bmN0aW9uICgpIHtcbi8vICAgICAgICAgICAgICAgICAgICBhcEludGVydmFsID0gc2V0SW50ZXJ2YWwoYXV0b01vdmUsIG9wdGlvbnMuYXV0b1BsYXkpO1xuLy8gICAgICAgICAgICAgICAgfVxuLy8gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgICQod2luZG93KS5yZXNpemUodXBkYXRlV2lkdGgpO1xuICAgICAgICBpZiAoJGVsbS5pcyhcIjpoaWRkZW5cIikpIHtcbiAgICAgICAgICAgICRlbG0uYWRkQ2xhc3MoXCJzaG93XCIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdXBkYXRlV2lkdGgoKTtcbiAgICAgICAgfVxuICAgICAgICAkZWxtLm9uKHtcbiAgICAgICAgICAgIHVwZGF0ZVVpOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdXBkYXRlV2lkdGgoKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzaG93OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgLy8gJGVsbS5yZW1vdmVDbGFzcyhcInNob3dcIik7XG4gICAgICAgICAgICAgICAgdXBkYXRlV2lkdGgoKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBkZXN0cm95OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgaWYgKGFwSW50ZXJ2YWwpe1xuICAgICAgICAgICAgICAgICAgICBjbGVhckludGVydmFsKGFwSW50ZXJ2YWwpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICQod2luZG93KS5vZmYoe3Jlc2l6ZTogdXBkYXRlV2lkdGh9KTtcblxuICAgICAgICAgICAgfVxuICAgICAgICB9KS5hZGRDbGFzcyhcImRlc3Ryb3lcIik7XG4gICAgfSk7XG59O1xuXG4iLCIkLmZuLmRlc3Ryb3kgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMuZWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBlbG0gPSAkKHRoaXMpLmRldGFjaCgpO1xuICAgICAgICBpZiAoZWxtLmhhc0NsYXNzKFwiZGVzdHJveVwiKSkge1xuICAgICAgICAgICAgZWxtLnRyaWdnZXIoXCJkZXN0cm95XCIpO1xuICAgICAgICB9XG4gICAgICAgIGVsbS5maW5kKFwiLmRlc3Ryb3lcIikudHJpZ2dlcignZGVzdHJveScpO1xuICAgICAgICBlbG0ucmVtb3ZlKCk7XG4gICAgfSk7XG59O1xuJC5mbi5zaG93SW5pdCA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGVsbSA9ICQodGhpcykuc2hvdygpO1xuICAgICAgICBlbG0uZmluZChcIi5zaG93XCIpLnRyaWdnZXIoJ3Nob3cnKTtcbiAgICB9KTtcbn07XG5cblxuJC5mbi51aVZhbCA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgdWk7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT0gMCkge1xuICAgICAgICB1aSA9ICQodGhpcykuZGF0YShcInVpXCIpO1xuICAgICAgICByZXR1cm4gdWkgJiYgdWkuZ2V0VmFsdWUoKVxuICAgIH1cbiAgICB2YXIgdiA9IGFyZ3VtZW50c1swXTtcbiAgICByZXR1cm4gJCh0aGlzKS5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdWkgPSAkKHRoaXMpLmRhdGEoXCJ1aVwiKTtcbiAgICAgICAgaWYgKHVpKSB7XG4gICAgICAgICAgICB1aS5zZXRWYWx1ZSh2KTtcbiAgICAgICAgfVxuICAgIH0pO1xufTsiLCIkLmZuLmltYWdlU2l6ZSA9IGZ1bmN0aW9uIChvcHRpb25zKSB7XG5cbiAgICByZXR1cm4gJCh0aGlzKS5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgb3B0aW9ucyA9ICQuZXh0ZW5kKHtcbiAgICAgICAgICAgIHdpZHRoOiAxLCBoZWlnaHQ6IDEsIGFuaW1hdGVPcGFjaXR5OiBmYWxzZVxuICAgICAgICB9LCBvcHRpb25zKTtcbiAgICAgICAgZnVuY3Rpb24gb25Mb2FkKCkge1xuICAgICAgICAgICAgdmFyIGExID0gdGhpcy5uYXR1cmFsV2lkdGggLyB0aGlzLm5hdHVyYWxIZWlnaHQ7XG4gICAgICAgICAgICB2YXIgYTIgPSAxO1xuICAgICAgICAgICAgaWYgKG9wdGlvbnMuaGVpZ2h0ID4gMCkge1xuICAgICAgICAgICAgICAgIGEyID0gb3B0aW9ucy53aWR0aCAvIG9wdGlvbnMuaGVpZ2h0O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGExID4gYTIpIHtcbiAgICAgICAgICAgICAgICAkKHRoaXMpLmFkZENsYXNzKFwiZml0LXN3aXRjaFwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChvcHRpb25zLmFuaW1hdGVPcGFjaXR5KSB7XG4gICAgICAgICAgICAgICAgJCh0aGlzKS5hbmltYXRlKHtvcGFjaXR5OiAxfSwgMjAwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoJCh0aGlzKS5oYXNDbGFzcyhcInNob3dcIikpe1xuICAgICAgICAgICAgaWYgKCQodGhpcykuaXMoXCI6dmlzaWJsZVwiKSl7XG4gICAgICAgICAgICAgICAgJCh0aGlzKS5vbihcImxvYWRcIiwgb25Mb2FkKS5hdHRyKFwic3JjXCIsICQodGhpcykuZGF0YShcInNyY1wiKSkucmVtb3ZlQ2xhc3MoXCJzaG93XCIpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiBzaG93KCl7XG4gICAgICAgICAgICAgICAgICAgICQodGhpcykub24oXCJsb2FkXCIsIG9uTG9hZCkuYXR0cihcInNyY1wiLCAkKHRoaXMpLmRhdGEoXCJzcmNcIikpLnJlbW92ZUNsYXNzKFwic2hvd1wiKTtcbiAgICAgICAgICAgICAgICAgICAgJCh0aGlzKS5vZmYoXCJzaG93XCIsIHNob3cpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAkKHRoaXMpLm9uKFwic2hvd1wiLCBzaG93KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmICh0aGlzLm5hdHVyYWxXaWR0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAkKHRoaXMpLnJlbW92ZUNsYXNzKFwiZml0LXN3aXRjaFwiKTtcbiAgICAgICAgICAgICAgICBvbkxvYWQuY2FsbCh0aGlzKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgJCh0aGlzKS5vbihcImxvYWRcIiwgb25Mb2FkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG5cbiAgICB9KTtcbn07XG5cbiIsIiQuZm4udWlMb2FkZXIgPSBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgIG9wdGlvbnMgPSAkLmV4dGVuZCh7fSwgb3B0aW9ucyk7XG4gICAgcmV0dXJuIHRoaXMuZWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciAkZWxtID0gJCh0aGlzKSwgJGNsb2NrID0gJCgnPGRpdiBjbGFzcz1cInVpLWxvYWRlci1jbG9ja1wiPicpLmFwcGVuZFRvKCRlbG0pO1xuICAgICAgICB2YXIgJGltYWdlID0gJCgnPGRpdiBjbGFzcz1cInVpLWxvYWRlci1pbWFnZVwiPicpLmFwcGVuZFRvKCRjbG9jayk7XG4gICAgICAgICRlbG0uYWRkQ2xhc3MoXCJ1aS1sb2FkZXJcIik7XG4gICAgICAgICRjbG9jay5jc3Moe2Rpc3BsYXk6IFwibm9uZVwifSk7XG4gICAgICAgIHZhciBzY3JvbGxGbiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBlbG1Ub3AgPSAkZWxtLm9mZnNldCgpLnRvcDtcbiAgICAgICAgICAgIHZhciBlbG1IZWlnaHQgPSAkZWxtLmhlaWdodCgpO1xuICAgICAgICAgICAgdmFyIHdpbmRvd0hlaWdodCA9ICQod2luZG93KS5oZWlnaHQoKTtcbiAgICAgICAgICAgIHZhciB3aW5kb3dTY3JvbGxUb3AgPSAkKHdpbmRvdykuc2Nyb2xsVG9wKCk7XG5cbiAgICAgICAgICAgIHZhciB0b3AgPSBNYXRoLm1heChlbG1Ub3AsIHdpbmRvd1Njcm9sbFRvcCk7XG4gICAgICAgICAgICB2YXIgYm90dG9tID0gTWF0aC5taW4oZWxtVG9wICsgZWxtSGVpZ2h0LCB3aW5kb3dTY3JvbGxUb3AgKyB3aW5kb3dIZWlnaHQpO1xuICAgICAgICAgICAgdmFyIGEgPSAoYm90dG9tIC0gdG9wKSAvIDI7XG4gICAgICAgICAgICAvL2NvbnNvbGUubG9nKHtcbiAgICAgICAgICAgIC8vICAgIGVsbVRvcDogZWxtVG9wLFxuICAgICAgICAgICAgLy8gICAgZWxtSGVpZ2h0OiBlbG1IZWlnaHQsXG4gICAgICAgICAgICAvLyAgICB3aW5kb3dIZWlnaHQ6IHdpbmRvd0hlaWdodCxcbiAgICAgICAgICAgIC8vICAgIHdpbmRvd1Njcm9sbFRvcDogd2luZG93U2Nyb2xsVG9wLFxuICAgICAgICAgICAgLy8gICAgdG9wOiB0b3AsXG4gICAgICAgICAgICAvLyAgICBib3R0b206IGJvdHRvbSxcbiAgICAgICAgICAgIC8vICAgIGE6IGEsXG4gICAgICAgICAgICAvLyAgICBiOiBhICsgZWxtVG9wIC0gd2luZG93U2Nyb2xsVG9wXG4gICAgICAgICAgICAvL30pO1xuICAgICAgICAgICAgJGltYWdlLmNzcyh7dG9wOiAoYSArIE1hdGgubWF4KHdpbmRvd1Njcm9sbFRvcCAtIGVsbVRvcCwgMCkpICsgXCJweFwifSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgZnVuY3Rpb24gc3RvcCgpIHtcbiAgICAgICAgICAgICRlbG0ucmVtb3ZlQ2xhc3MoXCJ1aS1sb2FkaW5nXCIpO1xuICAgICAgICAgICAgJGNsb2NrLmNzcyh7ZGlzcGxheTogXCJub25lXCJ9KTtcbiAgICAgICAgICAgICQod2luZG93KS5vZmYoXCJzY3JvbGxcIiwgc2Nyb2xsRm4pO1xuICAgICAgICB9XG5cblxuICAgICAgICAkZWxtLm9uKHtcbiAgICAgICAgICAgIFwibG9hZGVyLnN0b3BcIjogZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgICAgICBzdG9wKCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJsb2FkZXIuc3RvcE9uZVwiOiBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgICAgIHN0b3AoKTtcbiAgICAgICAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwibG9hZGVyLnN0YXJ0XCI6IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgICAgICAkKHdpbmRvdykub24oXCJzY3JvbGxcIiwgc2Nyb2xsRm4pO1xuICAgICAgICAgICAgICAgIHZhciBlbG1Ub3AgPSAkZWxtLm9mZnNldCgpLnRvcDtcbiAgICAgICAgICAgICAgICB2YXIgZWxtSGVpZ2h0ID0gJGVsbS5oZWlnaHQoKTtcbiAgICAgICAgICAgICAgICB2YXIgd2luZG93SGVpZ2h0ID0gJCh3aW5kb3cpLmhlaWdodCgpO1xuICAgICAgICAgICAgICAgIHZhciB3aW5kb3dTY3JvbGxUb3AgPSAkKHdpbmRvdykuc2Nyb2xsVG9wKCk7XG5cbiAgICAgICAgICAgICAgICB2YXIgdG9wID0gTWF0aC5tYXgoZWxtVG9wLCB3aW5kb3dTY3JvbGxUb3ApO1xuICAgICAgICAgICAgICAgIHZhciBib3R0b20gPSBNYXRoLm1pbihlbG1Ub3AgKyBlbG1IZWlnaHQsIHdpbmRvd1Njcm9sbFRvcCArIHdpbmRvd0hlaWdodCk7XG4gICAgICAgICAgICAgICAgdmFyIGEgPSAoYm90dG9tIC0gdG9wKSAvIDI7XG4gICAgICAgICAgICAgICAgJGltYWdlLmNzcyh7dG9wOiAoYSArIE1hdGgubWF4KHdpbmRvd1Njcm9sbFRvcCAtIGVsbVRvcCwgMCkpICsgXCJweFwifSk7XG5cbiAgICAgICAgICAgICAgICAkZWxtLnJlbW92ZUNsYXNzKFwidWktbG9hZGluZ1wiKTtcbiAgICAgICAgICAgICAgICAkZWxtLmFkZENsYXNzKFwidWktbG9hZGluZ1wiKTtcbiAgICAgICAgICAgICAgICAkY2xvY2suY3NzKHtvcGFjaXR5OiAwLjcsIGRpc3BsYXk6IFwiYmxvY2tcIn0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KVxuICAgIH0pO1xufTtcblxuIiwiLy92YXIgc3R5bGVzID0gcmVxdWlyZShcIi4vc3R5bGVzXCIpO1xuXG5mdW5jdGlvbiBnZXRTY3JvbGxCYXJXaWR0aCgpIHtcbi8vICAgIHZhciBkZWZhdWx0U3R5bGUgPSBnZXREZWZhdWx0U3R5bGUoKTsgLy9EZWZhdWx0IGJyb3dzZXIgZWxlbWVudCBzdHlsZXMgKHN0eWxlcy5qcylcblxuICAgIHZhciBpbm5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3AnKTtcbiAgICBpbm5lci5zdHlsZS53aWR0aCA9IFwiMTAwJVwiO1xuICAgIGlubmVyLnN0eWxlLmhlaWdodCA9IFwiMjAwcHhcIjtcblxuICAgIHZhciBvdXRlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIG91dGVyLnN0eWxlLnBvc2l0aW9uID0gXCJhYnNvbHV0ZVwiO1xuICAgIG91dGVyLnN0eWxlLnRvcCA9IFwiMHB4XCI7XG4gICAgb3V0ZXIuc3R5bGUubGVmdCA9IFwiMHB4XCI7XG4gICAgb3V0ZXIuc3R5bGUudmlzaWJpbGl0eSA9IFwiaGlkZGVuXCI7XG4gICAgb3V0ZXIuc3R5bGUud2lkdGggPSBcIjIwMHB4XCI7XG4gICAgb3V0ZXIuc3R5bGUuaGVpZ2h0ID0gXCIxNTBweFwiO1xuICAgIG91dGVyLnN0eWxlLm92ZXJmbG93ID0gXCJoaWRkZW5cIjtcbiAgICBvdXRlci5hcHBlbmRDaGlsZChpbm5lcik7XG5cbiAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKG91dGVyKTtcbiAgICB2YXIgdzEgPSBpbm5lci5vZmZzZXRXaWR0aDtcbiAgICBvdXRlci5zdHlsZS5vdmVyZmxvdyA9ICdzY3JvbGwnO1xuICAgIHZhciB3MiA9IGlubmVyLm9mZnNldFdpZHRoO1xuICAgIGlmICh3MSA9PSB3Mikge1xuICAgICAgICB3MiA9IG91dGVyLmNsaWVudFdpZHRoO1xuICAgIH1cbiAgICBkb2N1bWVudC5ib2R5LnJlbW92ZUNoaWxkKG91dGVyKTtcbiAgICByZXR1cm4gKHcxIC0gdzIpO1xufVxuXG52YXIgU0NST0xMX0JBUl9XSURUSDtcbiQoZnVuY3Rpb24gKCkge1xuICAgIFNDUk9MTF9CQVJfV0lEVEggPSBnZXRTY3JvbGxCYXJXaWR0aCgpO1xufSk7XG5cbmV4cG9ydHMuZ2V0U2Nyb2xsQmFyV2lkdGggPSBnZXRTY3JvbGxCYXJXaWR0aDtcbiIsImZ1bmN0aW9uIE9uTW91c2UoZWxtLCBldmVudHMsIHNlbGVjdG9yKSB7XG4gICAgdmFyICRlbG0gPSAkKGVsbSksXG4gICAgICAgIHBvc2l0aW9uU3RhcnQsXG4gICAgICAgIHBvc2l0aW9uID0ge30sXG4gICAgICAgIHRhcmdldCxcbiAgICAgICAgcHJldmVudERlZmF1bHQgPSBmYWxzZSxcbiAgICAgICAgc3RvcFByb3BhZ2F0aW9uID0gZmFsc2UsXG4gICAgICAgIGRyYWdEZXRlY3QgPSBudWxsLFxuICAgICAgICBkcmFnID0gMCxcbiAgICAgICAgbW92ZWQgPSBmYWxzZSxcbiAgICAgICAgY2FuY2VsZWQgPSBmYWxzZTtcbiAgICB2YXIgcG9zT2JqID0ge1xuICAgICAgICBkYXRhOiB7fSxcbiAgICAgICAgcG9zaXRpb246IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgeDogcG9zaXRpb24ueCxcbiAgICAgICAgICAgICAgICB5OiBwb3NpdGlvbi55XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIGRldGVjdEhvcml6b250YWxEcmFnOiBmdW5jdGlvbiAoeCwgeSkge1xuICAgICAgICAgICAgZHJhZ0RldGVjdCA9IHt4OiB4LCB5OiB5LCB0eXBlOiBcImhvcml6b250YWxcIn07XG4gICAgICAgIH0sXG4gICAgICAgIGRldGVjdERyYWc6IGZ1bmN0aW9uICh4LCB5KSB7XG4gICAgICAgICAgICBkcmFnRGV0ZWN0ID0ge3g6IHgsIHk6IHksIHR5cGU6IFwiYm90aFwifTtcbiAgICAgICAgfSxcbiAgICAgICAgcG9zaXRpb25TdGFydDogZnVuY3Rpb24gKG9iaikge1xuICAgICAgICAgICAgaWYgKG9iaiAmJiBvYmoueCkge1xuICAgICAgICAgICAgICAgIHBvc2l0aW9uU3RhcnQueCA9IG9iai54O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKG9iaiAmJiBvYmoueSkge1xuICAgICAgICAgICAgICAgIHBvc2l0aW9uU3RhcnQueSA9IG9iai55O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICB4OiBwb3NpdGlvblN0YXJ0LngsXG4gICAgICAgICAgICAgICAgeTogcG9zaXRpb25TdGFydC55XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIGRpZmY6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgeDogcG9zaXRpb24ueCAtIHBvc2l0aW9uU3RhcnQueCxcbiAgICAgICAgICAgICAgICB5OiBwb3NpdGlvbi55IC0gcG9zaXRpb25TdGFydC55XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIGlzVG91Y2g6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBwb3NpdGlvbi50b3VjaDtcbiAgICAgICAgfSxcbiAgICAgICAgaXNDYW5jZWxlZDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIGNhbmNlbGVkO1xuICAgICAgICB9LFxuICAgICAgICBpc0RyYWc6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBkcmFnID09IDE7XG4gICAgICAgIH0sXG4gICAgICAgIGhhc01vdmVkOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gbW92ZWQ7XG4gICAgICAgIH0sXG4gICAgICAgIHByZXZlbnREZWZhdWx0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBwcmV2ZW50RGVmYXVsdCA9IHRydWU7XG4gICAgICAgIH0sXG4gICAgICAgIGlzRGVmYXVsdFByZXZlbnRlZDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHByZXZlbnREZWZhdWx0O1xuICAgICAgICB9LFxuICAgICAgICBzdG9wUHJvcGFnYXRpb246IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHN0b3BQcm9wYWdhdGlvbiA9IHRydWU7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gZ2V0TW91c2UoZXZlbnQpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHg6IGV2ZW50LnBhZ2VYICsgKGV2ZW50LmlmcmFtZUxlZnQgfHwgMCksXG4gICAgICAgICAgICB5OiBldmVudC5wYWdlWSArIChldmVudC5pZnJhbWVUb3AgfHwgMCksXG4gICAgICAgICAgICB0b3VjaDogZmFsc2VcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdldFRvdWNoKGV2ZW50KSB7XG4gICAgICAgIHZhciB0b3VjaGVzID0gZXZlbnQub3JpZ2luYWxFdmVudC50b3VjaGVzO1xuICAgICAgICBpZiAodG91Y2hlcyAmJiB0b3VjaGVzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgeDogdG91Y2hlc1swXS5wYWdlWCxcbiAgICAgICAgICAgICAgICB5OiB0b3VjaGVzWzBdLnBhZ2VZLFxuICAgICAgICAgICAgICAgIHRvdWNoOiB0cnVlXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBkZXRlY3REcmFnKCkge1xuICAgICAgICB2YXIgZGlmZiA9IHBvc09iai5kaWZmKCk7XG4gICAgICAgIGlmIChkcmFnRGV0ZWN0ICYmIGRyYWdEZXRlY3QudHlwZSA9PSBcImhvcml6b250YWxcIikge1xuICAgICAgICAgICAgaWYgKE1hdGguYWJzKGRpZmYueCkgPiBkcmFnRGV0ZWN0LnggJiYgZHJhZyA9PSAwKSB7XG4gICAgICAgICAgICAgICAgZHJhZyA9IDE7XG4gICAgICAgICAgICAgICAgdGFyZ2V0LnRyaWdnZXIoXCJkcmFnLnN0YXJ0XCIsIFtwb3NPYmpdKTtcbiAgICAgICAgICAgICAgICBwb3NPYmoucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoTWF0aC5hYnMoZGlmZi55KSA+IGRyYWdEZXRlY3QueSAmJiBkcmFnID09IDApIHtcbiAgICAgICAgICAgICAgICBkcmFnID0gMjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmIChkcmFnRGV0ZWN0ICYmIGRyYWdEZXRlY3QudHlwZSA9PSBcImJvdGhcIikge1xuICAgICAgICAgICAgaWYgKChNYXRoLmFicyhkaWZmLnkpID4gZHJhZ0RldGVjdC55IHx8IE1hdGguYWJzKGRpZmYueCkgPiBkcmFnRGV0ZWN0LngpICYmIGRyYWcgPT0gMCkge1xuICAgICAgICAgICAgICAgIGRyYWcgPSAxO1xuICAgICAgICAgICAgICAgIHRhcmdldC50cmlnZ2VyKFwiZHJhZy5zdGFydFwiLCBbcG9zT2JqXSk7XG4gICAgICAgICAgICAgICAgcG9zT2JqLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGRyYWcgPT0gMSkge1xuICAgICAgICAgICAgdGFyZ2V0LnRyaWdnZXIoXCJkcmFnLm1vdmVcIiwgW3Bvc09ial0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZGV0ZWN0TW92ZSgpIHtcbiAgICAgICAgaWYgKE1hdGguYWJzKHBvc2l0aW9uLngpID4gMCB8fCBNYXRoLmFicyhwb3NpdGlvbi55KSA+IDApIHtcbiAgICAgICAgICAgIG1vdmVkID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIG1vdXNlbW92ZShldmVudCkge1xuXG4gICAgICAgIHBvc2l0aW9uID0gZ2V0TW91c2UoZXZlbnQpO1xuICAgICAgICB0YXJnZXQudHJpZ2dlcihcIm1vdXNlLm1vdmVcIiwgW3Bvc09ial0pO1xuICAgICAgICBkZXRlY3REcmFnKCk7XG4gICAgICAgIGRldGVjdE1vdmUoKTtcblxuICAgICAgICBpZiAocHJldmVudERlZmF1bHQpIHtcbiAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHN0b3BQcm9wYWdhdGlvbikge1xuICAgICAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiB0b3VjaG1vdmUoZXZlbnQpIHtcblxuICAgICAgICBwb3NpdGlvbiA9IGdldFRvdWNoKGV2ZW50KTtcbiAgICAgICAgdGFyZ2V0LnRyaWdnZXIoXCJtb3VzZS5tb3ZlXCIsIFtwb3NPYmpdKTtcbiAgICAgICAgZGV0ZWN0RHJhZygpO1xuICAgICAgICBkZXRlY3RNb3ZlKCk7XG4gICAgICAgIGlmIChwcmV2ZW50RGVmYXVsdCkge1xuICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoc3RvcFByb3BhZ2F0aW9uKSB7XG4gICAgICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgfVxuXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc2Nyb2xsKCkge1xuICAgICAgICBkcmFnID0gMjtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnbG9iYWxCaW5kKG5hbWUsIHR5cGUpIHtcbiAgICAgICAgaWYgKFwidHlwZVwiID09IFwidG91Y2hcIikge1xuLy8gICAgICAgICAgICAkKHdpbmRvdykuYmluZChcInRvdWNobW92ZVwiLCB0b3VjaG1vdmUpO1xuXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAkKHdpbmRvdylbbmFtZV0oe1xuICAgICAgICAgICAgICAgIG1vdXNldXA6IG1vdXNldXAsXG4gICAgICAgICAgICAgICAgbW91c2Vtb3ZlOiBtb3VzZW1vdmVcbi8vICAgICAgICAgICAgICAgIHNjcm9sbDogc2Nyb2xsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICQod2luZG93KVtuYW1lXSh7XG4gICAgICAgICAgICAgICAga2V5ZG93bjoga2V5ZG93blxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgIH1cblxuICAgIGZ1bmN0aW9uIG1vdXNldXAoZXZlbnQpIHtcbiAgICAgICAgcG9zaXRpb24gPSBnZXRNb3VzZShldmVudCk7XG4gICAgICAgIHRhcmdldC50cmlnZ2VyKFwibW91c2Uuc3RvcFwiLCBbcG9zT2JqXSk7XG4gICAgICAgIGlmIChwb3NPYmouaXNEcmFnKCkpIHtcbiAgICAgICAgICAgIHRhcmdldC50cmlnZ2VyKFwiZHJhZy5zdG9wXCIsIFtwb3NPYmpdKTtcbiAgICAgICAgfVxuICAgICAgICBkcmFnID0gMDtcbiAgICAgICAgaWYgKHByZXZlbnREZWZhdWx0KSB7XG4gICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzdG9wUHJvcGFnYXRpb24pIHtcbiAgICAgICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICB9XG4gICAgICAgIGdsb2JhbEJpbmQoXCJvZmZcIik7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gdG91Y2hlbmQoZXZlbnQpIHtcbiAgICAgICAgdGFyZ2V0LnRyaWdnZXIoXCJtb3VzZS5zdG9wXCIsIFtwb3NPYmpdKTtcbiAgICAgICAgaWYgKHBvc09iai5pc0RyYWcoKSkge1xuICAgICAgICAgICAgdGFyZ2V0LnRyaWdnZXIoXCJkcmFnLnN0b3BcIiwgW3Bvc09ial0pO1xuICAgICAgICB9XG4gICAgICAgIGRyYWcgPSAwO1xuICAgICAgICBpZiAocHJldmVudERlZmF1bHQpIHtcbiAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHN0b3BQcm9wYWdhdGlvbikge1xuICAgICAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgIH1cbiAgICAgICAgZ2xvYmFsQmluZChcIm9mZlwiLCBcInRvdWNoXCIpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHRvdWNoY2FuY2VsKGV2ZW50KSB7XG4gICAgICAgIHRhcmdldC50cmlnZ2VyKFwibW91c2UuZW5kXCIsIFtwb3NPYmpdKTtcbiAgICAgICAgY2FuY2VsZWQgPSB0cnVlO1xuICAgICAgICBpZiAocHJldmVudERlZmF1bHQpIHtcbiAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHN0b3BQcm9wYWdhdGlvbikge1xuICAgICAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBrZXlkb3duKGUpIHtcbiAgICAgICAgaWYgKGUud2hpY2ggPT0gMjcpIHtcbiAgICAgICAgICAgIGNhbmNlbGVkID0gdHJ1ZTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiY2FuY2VsXCIpO1xuICAgICAgICAgICAgcG9zaXRpb24gPSB7eDogLTEsIHk6IC0xfTtcbiAgICAgICAgICAgIHRhcmdldC50cmlnZ2VyKFwibW91c2Uuc3RvcFwiLCBbcG9zT2JqXSk7XG4gICAgICAgICAgICBpZiAocHJldmVudERlZmF1bHQpIHtcbiAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoc3RvcFByb3BhZ2F0aW9uKSB7XG4gICAgICAgICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGdsb2JhbEJpbmQoXCJvZmZcIik7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiByZXNldCgpIHtcbiAgICAgICAgY2FuY2VsZWQgPSBmYWxzZTtcbiAgICAgICAgbW92ZWQgPSBmYWxzZTtcbiAgICAgICAgcG9zT2JqLmRhdGEgPSB7fTtcbiAgICAgICAgZHJhZyA9IDA7XG4gICAgICAgIGRyYWdEZXRlY3QgPSBudWxsO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIG1vdXNlZG93bihldmVudCkge1xuICAgICAgICBpZiAoZXZlbnQud2hpY2ggPT0gMSAmJiAhcG9zT2JqLmlzVG91Y2goKSkge1xuXG4gICAgICAgICAgICBwb3NPYmouaWZyYW1lTGVmdCA9IGV2ZW50LmlmcmFtZUxlZnQgPSBOdW1iZXIoJCh0aGlzLm93bmVyRG9jdW1lbnQpLmZpbmQoXCJib2R5XCIpLmF0dHIoXCJkYXRhLWlmcmFtZWxlZnRcIikgfHwgMCk7XG4gICAgICAgICAgICBwb3NPYmouaWZyYW1lVG9wID0gZXZlbnQuaWZyYW1lVG9wID0gTnVtYmVyKCQodGhpcy5vd25lckRvY3VtZW50KS5maW5kKFwiYm9keVwiKS5hdHRyKFwiZGF0YS1pZnJhbWV0b3BcIikgfHwgMCk7XG4gICAgICAgICAgICBwb3NpdGlvbiA9IHBvc2l0aW9uU3RhcnQgPSBnZXRNb3VzZShldmVudCk7XG4gICAgICAgICAgICBwcmV2ZW50RGVmYXVsdCA9IGV2ZW50LmlzRGVmYXVsdFByZXZlbnRlZCgpO1xuICAgICAgICAgICAgdGFyZ2V0ID0gJCh0aGlzKTtcbiAgICAgICAgICAgIHJlc2V0KCk7XG4gICAgICAgICAgICB0YXJnZXQudHJpZ2dlcihcIm1vdXNlLnN0YXJ0XCIsIFtwb3NPYmpdKTtcbiAgICAgICAgICAgIGlmIChkcmFnRGV0ZWN0ICYmICFwb3NPYmouaXNUb3VjaCgpKSB7XG4gICAgICAgICAgICAgICAgdGFyZ2V0LnRyaWdnZXIoXCJkcmFnLnN0YXJ0XCIsIFtwb3NPYmpdKTtcbiAgICAgICAgICAgICAgICBwb3NPYmoucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChwcmV2ZW50RGVmYXVsdCkge1xuICAgICAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoc3RvcFByb3BhZ2F0aW9uKSB7XG4gICAgICAgICAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBnbG9iYWxCaW5kKFwib25cIik7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiB0b3VjaHN0YXJ0KGV2ZW50KSB7XG4gICAgICAgIGlmIChldmVudC5vcmlnaW5hbEV2ZW50LnRvdWNoZXMubGVuZ3RoID4gMSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHBvc2l0aW9uID0gcG9zaXRpb25TdGFydCA9IGdldFRvdWNoKGV2ZW50KTtcbiAgICAgICAgZ2xvYmFsQmluZChcIm9uXCIsIFwidG91Y2hcIik7XG4gICAgICAgIHByZXZlbnREZWZhdWx0ID0gZXZlbnQuaXNEZWZhdWx0UHJldmVudGVkKCk7XG4gICAgICAgIHRhcmdldCA9ICQodGhpcyk7XG4gICAgICAgIHJlc2V0KCk7XG4gICAgICAgIHRhcmdldC50cmlnZ2VyKFwibW91c2Uuc3RhcnRcIiwgW3Bvc09ial0pO1xuICAgICAgICBpZiAocHJldmVudERlZmF1bHQpIHtcbiAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHN0b3BQcm9wYWdhdGlvbikge1xuICAgICAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgIH1cblxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlc3R1cmVjaGFuZ2UoZXZlbnQpIHtcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgJGVsbS50cmlnZ2VyKFwibW91c2Uuc2NhbGVcIiwgW3Bvc09iaiwgZXZlbnQub3JpZ2luYWxFdmVudC5zY2FsZV0pO1xuICAgIH1cblxuICAgICRlbG0ub24oe1xuICAgICAgICB0b3VjaHN0YXJ0OiB0b3VjaHN0YXJ0LFxuICAgICAgICB0b3VjaG1vdmU6IHRvdWNobW92ZSxcbiAgICAgICAgZ2VzdHVyZWNoYW5nZTogZ2VzdHVyZWNoYW5nZSxcbiAgICAgICAgdG91Y2hlbmQ6IHRvdWNoZW5kLFxuLy8gICAgICAgIHRvdWNoY2FuY2VsOiB0b3VjaGNhbmNlbCxcbiAgICAgICAgbW91c2Vkb3duOiBtb3VzZWRvd25cbiAgICB9LCBzZWxlY3Rvcik7XG5cbiAgICAkZWxtLm9uKGV2ZW50cywgc2VsZWN0b3IpO1xufVxuXG4kLmZuLm9uTW91c2UgPSBmdW5jdGlvbiAoZXZlbnRzLCBzZWxlY3Rvcikge1xuICAgIHJldHVybiB0aGlzLmVhY2goZnVuY3Rpb24gKCkge1xuICAgICAgICBuZXcgT25Nb3VzZSh0aGlzLCBldmVudHMsIHNlbGVjdG9yKTtcbiAgICB9KTtcbn07XG5cbiQuaXNUb3VjaERldmljZSA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gJ29udG91Y2hzdGFydCcgaW4gd2luZG93IC8vIHdvcmtzIG9uIG1vc3QgYnJvd3NlcnNcbiAgICAgICAgfHwgJ29ubXNnZXN0dXJlY2hhbmdlJyBpbiB3aW5kb3c7IC8vIHdvcmtzIG9uIGllMTBcbn07XG5cbnZhciB0b3VjaElkID0gbnVsbDtcblxuJC5mbi5iaW5kVGFwID0gZnVuY3Rpb24gKGV2ZW50cywgc2VsZWN0b3IpIHtcbiAgICByZXR1cm4gdGhpcy5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyICRlbG0gPSAkKHRoaXMpO1xuICAgICAgICB2YXIgdG91Y2hDbGljayA9IGZhbHNlO1xuICAgICAgICAkZWxtLm9uKHtcbiAgICAgICAgICAgIHRvdWNoc3RhcnQ6IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAgICAgaWYgKGUub3JpZ2luYWxFdmVudC50b3VjaGVzLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cblxuLy8gICAgICAgICAgICAgICAgdG91Y2hDbGljayA9IHRydWU7XG4gICAgICAgICAgICAgICAgdG91Y2hDbGljayA9IHRvdWNoSWQgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbi8vICAgICAgICAgICAgICAgIGFsZXJ0KFwic3RhcnRcIik7XG4vLyAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdG91Y2htb3ZlOiBmdW5jdGlvbiAoZSkge1xuLy8gICAgICAgICAgICAgICAgaWYgKGUub3JpZ2luYWxFdmVudC50b3VjaGVzLmxlbmd0aCA+IDEpIHtcbi8vICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4vLyAgICAgICAgICAgICAgICB9XG4vLyAgICAgICAgICAgICAgICB0b3VjaENsaWNrID0gZmFsc2U7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdG91Y2hlbmQ6IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAgICAgaWYgKGUub3JpZ2luYWxFdmVudC50b3VjaGVzLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgaWYgKHRvdWNoQ2xpY2sgPT09IHRvdWNoSWQpIHtcbiAgICAgICAgICAgICAgICAgICAgJChlLnRhcmdldCkudHJpZ2dlcihcImNsaWNrXCIpO1xuICAgICAgICAgICAgICAgICAgICB0b3VjaENsaWNrID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRvdWNoY2FuY2VsOiBmdW5jdGlvbiAoKSB7XG4vLyAgICAgICAgICAgICAgICB0b3VjaENsaWNrID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIHNlbGVjdG9yKTtcbiAgICAgICAgJGVsbS5vbih7XG4gICAgICAgICAgICBnZXN0dXJlY2hhbmdlOiBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICB2YXIgc2NhbGUgPSBlLm9yaWdpbmFsRXZlbnQuc2NhbGU7XG4gICAgICAgICAgICAgICAgYWxlcnQoXCJzY2FsZSBcIiArIHNjYWxlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnZXN0dXJlZW5kOiBmdW5jdGlvbiAoZSkge1xuXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICAkZWxtLm9uKGV2ZW50cywgc2VsZWN0b3IpO1xuICAgIH0pO1xufTtcblxuXG4vLyhmdW5jdGlvbiAoKSB7XG4vLyAgICB2YXIgbm9Ub3VjaEVsZW1lbnRzID0gXCJ8U0VMRUNUfEF8XCI7XG4vLyAgICBpZiAoJChcIi5sdC1pZTlcIikubGVuZ3RoID4gMCkge1xuLy8gICAgICAgICQoZG9jdW1lbnQpLm9uKHtcbi8vICAgICAgICAgICAgY2xpY2s6IGZ1bmN0aW9uIChlKSB7XG4vLyAgICAgICAgICAgICAgICAkKGUudGFyZ2V0KS50cmlnZ2VyKFwidGFwXCIpO1xuLy8gICAgICAgICAgICB9XG4vLyAgICAgICAgfSk7XG4vLyAgICB9IGVsc2Uge1xuLy8gICAgICAgIHZhciB0b3VjaENsaWNrID0gZmFsc2U7XG4vLyAgICAgICAgdmFyIG1vdXNlRW5hYmxlZCA9IHRydWU7XG4vLyAgICAgICAgdmFyIG1vdXNlQ2xpY2sgPSBmYWxzZTtcbi8vICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwidG91Y2hzdGFydFwiLCBmdW5jdGlvbiAoKSB7XG4vLyAgICAgICAgICAgIHRvdWNoQ2xpY2sgPSB0cnVlO1xuLy8gICAgICAgICAgICBtb3VzZUVuYWJsZWQgPSBmYWxzZTtcbi8vICAgICAgICB9LCBmYWxzZSk7XG4vLyAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcInRvdWNobW92ZVwiLCBmdW5jdGlvbiAoKSB7XG4vLyAgICAgICAgICAgIHRvdWNoQ2xpY2sgPSBmYWxzZVxuLy8gICAgICAgIH0sIGZhbHNlKTtcbi8vICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwidG91Y2hlbmRcIiwgZnVuY3Rpb24gKGUpIHtcbi8vXG4vLyAgICAgICAgICAgIGlmICh0b3VjaENsaWNrICYmIG5vVG91Y2hFbGVtZW50cy5pbmRleE9mKGUudGFyZ2V0LnRhZ05hbWUpID09IC0xKSB7XG4vLyAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4vLyAgICAgICAgICAgICAgICB0b3VjaENsaWNrID0gZmFsc2U7XG4vLyAgICAgICAgICAgICAgICB2YXIgZXZlbnQgPSBkb2N1bWVudC5jcmVhdGVFdmVudChcIkN1c3RvbUV2ZW50XCIpO1xuLy8gICAgICAgICAgICAgICAgZXZlbnQuaW5pdEN1c3RvbUV2ZW50KFwidGFwXCIsIHRydWUsIHRydWUsIGUudGFyZ2V0KTtcbi8vICAgICAgICAgICAgICAgIGUudGFyZ2V0LmRpc3BhdGNoRXZlbnQoZXZlbnQpO1xuLy8gICAgICAgICAgICB9XG4vLyAgICAgICAgfSwgZmFsc2UpO1xuLy9cbi8vXG4vLyAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlZG93blwiLCBmdW5jdGlvbiAoKSB7XG4vLyAgICAgICAgICAgIGlmIChtb3VzZUVuYWJsZWQpIHtcbi8vICAgICAgICAgICAgICAgIG1vdXNlQ2xpY2sgPSB0cnVlXG4vLyAgICAgICAgICAgIH1cbi8vICAgICAgICB9LCBmYWxzZSk7XG4vLyAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlbW92ZVwiLCBmdW5jdGlvbiAoKSB7XG4vLyAgICAgICAgICAgIG1vdXNlQ2xpY2sgPSBmYWxzZVxuLy8gICAgICAgIH0sIGZhbHNlKTtcbi8vICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwibW91c2V1cFwiLCBmdW5jdGlvbiAoZSkge1xuLy8gICAgICAgICAgICBpZiAobW91c2VDbGljayAmJiBub1RvdWNoRWxlbWVudHMuaW5kZXhPZihlLnRhcmdldC50YWdOYW1lKSA9PSAtMSkge1xuLy8gICAgICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuLy8gICAgICAgICAgICAgICAgbW91c2VDbGljayA9IGZhbHNlO1xuLy8gICAgICAgICAgICAgICAgdmFyIGV2ZW50ID0gZG9jdW1lbnQuY3JlYXRlRXZlbnQoXCJDdXN0b21FdmVudFwiKTtcbi8vICAgICAgICAgICAgICAgIGV2ZW50LmluaXRDdXN0b21FdmVudChcInRhcFwiLCB0cnVlLCB0cnVlLCBlLnRhcmdldCk7XG4vLyAgICAgICAgICAgICAgICBlLnRhcmdldC5kaXNwYXRjaEV2ZW50KGV2ZW50KTtcbi8vICAgICAgICAgICAgfVxuLy8gICAgICAgIH0sIGZhbHNlKTtcbi8vICAgIH1cbi8vfSgpKTtcbiIsIi8vbW9kZSAxID0gXCJob3Jpem9udGFsXCIsIG1vZGUgMiA9IFwidmVydGljYWxcIlxuZnVuY3Rpb24gU2Nyb2xsYWJsZUZpbG1zdHJpcChlbG0sIG9wdGlvbnMpIHtcbiAgICB2YXIgJGVsbSA9ICQoZWxtKSwgcHJvcCA9ICRlbG0uaGFzQ2xhc3MoXCJ2ZXJ0aWNhbFwiKSA/IHtcInZcIjogXCJ0b3BcIiwgXCJ0XCI6IFwiaGVpZ2h0XCIsIGM6IFwieVwifSA6IHtcbiAgICAgICAgICAgIFwidlwiOiBcImxlZnRcIixcbiAgICAgICAgICAgIFwidFwiOiBcIndpZHRoXCIsXG4gICAgICAgICAgICBjOiBcInhcIlxuICAgICAgICB9O1xuICAgIG9wdGlvbnMgPSAkLmV4dGVuZCh7XG4gICAgICAgIG1vZGU6IDEsXG4gICAgICAgIGNsaWNrTW92ZTogMTAwLFxuICAgICAgICBpbnRlcnZhbDogMTAsXG4gICAgICAgIG1vdmU6IDUsXG4gICAgICAgIGhvdmVyOiB0cnVlLFxuICAgICAgICBib3hTY3JvbGw6IHRydWUsXG4gICAgICAgIGVuZGxlc3M6ICEhJChlbG0pLmRhdGEoXCJlbmRsZXNzXCIpXG4gICAgfSwgb3B0aW9ucyk7XG4gICAgdmFyIGksIGZ1bmMsIG1heCwgdGltZXIsIGJveGVzID0gJGVsbS5maW5kKFwiLnVpLWZpbG1zdHJpcC1ib3hcIikuc2hvdygpLFxuICAgICAgICBsZWZ0ID0gJGVsbS5maW5kKFwiLnVpLWZpbG1zdHJpcC1wcmV2XCIpLCByaWdodCA9ICRlbG0uZmluZChcIi51aS1maWxtc3RyaXAtbmV4dFwiKSwgYm94ZXNJbWcgPSBib3hlcy5maW5kKFwiaW1nXCIpO1xuXG4gICAgZnVuY3Rpb24gcG9zaXRpb25Cb3hlcyhudW1iZXIsIGFuaW0pIHtcbiAgICAgICAgYW5pbSA9IGFuaW0gfHwgZmFsc2U7XG4gICAgICAgIGlmIChib3hlcy5sZW5ndGggPT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHZhciBjV2lkdGggPSBib3hlcy5lcSgwKS5wb3NpdGlvbigpW3Byb3Audl0gKyBudW1iZXI7XG4gICAgICAgIGZvciAoaSA9IDAsIG1heCA9IGJveGVzLmxlbmd0aDsgaSA8IG1heDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgY3NzID0ge307XG4gICAgICAgICAgICBjc3NbcHJvcC52XSA9IGNXaWR0aDtcbiAgICAgICAgICAgIGlmIChhbmltKSB7XG4gICAgICAgICAgICAgICAgVHdlZW5MaXRlLmtpbGxUd2VlbnNPZihib3hlcy5lcShpKSk7XG4gICAgICAgICAgICAgICAgVHdlZW5MaXRlLnRvKGJveGVzLmVxKGkpLCAwLjUsIHtcbiAgICAgICAgICAgICAgICAgICAgY3NzOiBjc3MsIGVhc2U6IFBvd2VyMi5lYXNlSW4sIG9uQ29tcGxldGU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBib3hlcy5lcShpKS5jc3MoY3NzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNXaWR0aCArPSBib3hlcy5lcShpKVtwcm9wLnRdKCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGFuaW0pIHtcbiAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICRlbG0ucmVtb3ZlQ2xhc3MoXCJzdGF0dXMtc3RhcnRcIik7XG4gICAgICAgICAgICAgICAgJGVsbS5yZW1vdmVDbGFzcyhcInN0YXR1cy1lbmRcIik7XG4gICAgICAgICAgICAgICAgaWYgKGJveGVzLmVxKDApLnBvc2l0aW9uKClbcHJvcC52XSA9PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICRlbG0uYWRkQ2xhc3MoXCJzdGF0dXMtc3RhcnRcIik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChib3hlcy5lcShib3hlcy5sZW5ndGggLSAxKS5wb3NpdGlvbigpW3Byb3Audl0gKyBib3hlcy5lcShib3hlcy5sZW5ndGggLSAxKVtwcm9wLnRdKCkgPT0gJChlbG0pW3Byb3AudF0oKSkge1xuICAgICAgICAgICAgICAgICAgICAkZWxtLmFkZENsYXNzKFwic3RhdHVzLWVuZFwiKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgJGVsbS50cmlnZ2VyKFwiZmlsbXN0cmlwLm1vdmVkXCIpO1xuICAgICAgICAgICAgfSwgNjAwKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICRlbG0ucmVtb3ZlQ2xhc3MoXCJzdGF0dXMtc3RhcnRcIik7XG4gICAgICAgICAgICAkZWxtLnJlbW92ZUNsYXNzKFwic3RhdHVzLWVuZFwiKTtcbiAgICAgICAgICAgIGlmIChib3hlcy5lcSgwKS5wb3NpdGlvbigpW3Byb3Audl0gPT0gMCkge1xuICAgICAgICAgICAgICAgICRlbG0uYWRkQ2xhc3MoXCJzdGF0dXMtc3RhcnRcIik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoYm94ZXMuZXEoYm94ZXMubGVuZ3RoIC0gMSkucG9zaXRpb24oKVtwcm9wLnZdICsgYm94ZXMuZXEoYm94ZXMubGVuZ3RoIC0gMSlbcHJvcC50XSgpID09ICQoZWxtKVtwcm9wLnRdKCkpIHtcbiAgICAgICAgICAgICAgICAkZWxtLmFkZENsYXNzKFwic3RhdHVzLWVuZFwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgICRlbG0udHJpZ2dlcihcImZpbG1zdHJpcC5tb3ZlZFwiKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGhpZGVBcnJvd3MoKSB7XG4gICAgICAgIHZhciBhID0gMDtcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IGJveGVzSW1nLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBhICs9IGJveGVzSW1nLmVxKGkpW3Byb3AudF0oKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgYiA9ICRlbG1bcHJvcC50XSgpO1xuICAgICAgICBpZiAoYSA8IGIpIHtcbiAgICAgICAgICAgIGxlZnQuY3NzKHtkaXNwbGF5OiBcIm5vbmVcIn0pO1xuICAgICAgICAgICAgcmlnaHQuY3NzKHtkaXNwbGF5OiBcIm5vbmVcIn0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbGVmdC5jc3Moe2Rpc3BsYXk6IFwiXCJ9KTtcbiAgICAgICAgICAgIHJpZ2h0LmNzcyh7ZGlzcGxheTogXCJcIn0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgYm94ZXNJbWcuaW1hZ2VTaXplKCk7XG4gICAgaWYgKGJveGVzSW1nLmxlbmd0aCA+IDApIHtcbiAgICAgICAgdmFyIHRvTG9hZCA9IGJveGVzSW1nLmxlbmd0aDtcbiAgICAgICAgdmFyIGltZ0xvYWRlZCA9IDA7XG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBib3hlc0ltZy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaWYgKGJveGVzSW1nLmVxKGkpW3Byb3AudF0oKSA+IDApIHtcbiAgICAgICAgICAgICAgICB0b0xvYWQtLTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgYm94ZXNJbWcuZXEoaSkubG9hZChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIGltZ0xvYWRlZCsrO1xuICAgICAgICAgICAgICAgICAgICAkZWxtLnRyaWdnZXIoXCJpbWFnZUxvYWRcIiwgW2ltZ0xvYWRlZF0pO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgICRlbG0ub24oe1xuICAgICAgICAgICAgXCJpbWFnZUxvYWRcIjogZnVuY3Rpb24gKGUsIG51bSkge1xuICAgICAgICAgICAgICAgIGlmIChudW0gPT0gdG9Mb2FkKSB7XG4gICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uQm94ZXMoMCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGhpZGVBcnJvd3MoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSkudHJpZ2dlcihcImltYWdlTG9hZFwiLCBbaW1nTG9hZGVkXSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcG9zaXRpb25Cb3hlcygwKTtcbiAgICB9XG4gICAgaGlkZUFycm93cygpO1xuXG5cbiAgICBmdW5jdGlvbiByZXNpemUoKSB7XG4gICAgICAgIGlmIChib3hlc0ltZy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBwb3NpdGlvbkJveGVzKDApO1xuICAgICAgICB9XG4gICAgICAgIGhpZGVBcnJvd3MoKTtcbiAgICB9XG5cbiAgICAkZWxtLm9uKHtcbiAgICAgICAgdXBkYXRlVWk6IHJlc2l6ZSxcbiAgICAgICAgc2hvdzogcmVzaXplLFxuICAgICAgICBwb3NpdGlvbkJveGVzOiBmdW5jdGlvbiAoZSwgYSkge1xuICAgICAgICAgICAgaWYgKGEpIHtcbiAgICAgICAgICAgICAgICBwb3NpdGlvbkJveGVzKGEubnVtYmVyLCBhLmFuaW0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBkZXN0cm95OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkKHdpbmRvdykub2ZmKHtcbiAgICAgICAgICAgICAgICBtb3VzZXdoZWVsOiBzY3JvbGxlZCxcbiAgICAgICAgICAgICAgICByZXNpemU6IHJlc2l6ZSxcbiAgICAgICAgICAgICAgICBET01Nb3VzZVNjcm9sbDogc2Nyb2xsZWRcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfSkuYWRkQ2xhc3MoXCJzaG93IGRlc3Ryb3lcIik7XG5cblxuICAgICQod2luZG93KS5vbih7XG4gICAgICAgIC8vbW91c2V3aGVlbDogc2Nyb2xsZWQsXG4gICAgICAgIHJlc2l6ZTogcmVzaXplXG4gICAgICAgIC8vRE9NTW91c2VTY3JvbGw6IHNjcm9sbGVkXG4gICAgfSk7XG4gICAgZnVuY3Rpb24gc2Nyb2xsZWQoZSkge1xuICAgICAgICBpZiAoJGVsbS5nZXQoMCkgPT0gZS50YXJnZXQpIHtcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIGlmIChlLm9yaWdpbmFsRXZlbnQuZGV0YWlsID4gMCB8fCBlLm9yaWdpbmFsRXZlbnQud2hlZWxEZWx0YSA8IDApIHtcbiAgICAgICAgICAgICAgICByaWdodC50cmlnZ2VyKFwiY2xpY2tcIik7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGxlZnQudHJpZ2dlcihcImNsaWNrXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuXG4gICAgJGVsbS5vbih7XG4gICAgICAgIG1vdXNlZW50ZXI6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICQodGhpcykuYWRkQ2xhc3MoXCJzY3JvbGxhYmxlRmlsbXN0cmlwXCIpO1xuICAgICAgICB9LFxuICAgICAgICBtb3VzZWxlYXZlOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkKHRoaXMpLnJlbW92ZUNsYXNzKFwic2Nyb2xsYWJsZUZpbG1zdHJpcFwiKTtcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIGlmIChvcHRpb25zLmJveFNjcm9sbCkge1xuICAgICAgICBib3hlcy5vbk1vdXNlKHtcbiAgICAgICAgICAgIFwibW91c2Uuc3RhcnRcIjogZnVuY3Rpb24gKGUsIHBvcykge1xuICAgICAgICAgICAgICAgIHBvcy5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgIHBvcy5kYXRhLnggPSAkKHRoaXMpLnBvc2l0aW9uKCkubGVmdDtcbiAgICAgICAgICAgICAgICBwb3MuZGF0YS55ID0gJCh0aGlzKS5wb3NpdGlvbigpLnRvcDtcbiAgICAgICAgICAgICAgICBwb3MuZGF0YS5kaWZmMiA9IDA7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJtb3VzZS5tb3ZlXCI6IGZ1bmN0aW9uIChlLCBwb3MpIHtcbiAgICAgICAgICAgICAgICB2YXIgZGlmZiA9IHBvcy5kaWZmKCk7XG4gICAgICAgICAgICAgICAgdmFyIG1vdmUgPSBkaWZmW3Byb3AuY10gLSBwb3MuZGF0YS5kaWZmMjtcbiAgICAgICAgICAgICAgICB2YXIgZmlyc3QgPSBib3hlcy5lcSgwKTtcbiAgICAgICAgICAgICAgICB2YXIgbGFzdCA9IGJveGVzLmVxKGJveGVzLmxlbmd0aCAtIDEpO1xuICAgICAgICAgICAgICAgIGlmIChmaXJzdC5wb3NpdGlvbigpW3Byb3Audl0gKyBtb3ZlID4gMCkge1xuICAgICAgICAgICAgICAgICAgICBtb3ZlID0gMDtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGxhc3QucG9zaXRpb24oKVtwcm9wLnZdICsgbGFzdFtwcm9wLnRdKCkgKyBtb3ZlIDwgJGVsbVtwcm9wLnRdKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgbW92ZSA9IDA7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHBvc2l0aW9uQm94ZXMobW92ZSk7XG4gICAgICAgICAgICAgICAgcG9zLmRhdGEuZGlmZjIgPSBkaWZmW3Byb3AuY107XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHJpZ2h0Lm9uKHtcbiAgICAgICAgbW91c2VlbnRlcjogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaWYgKG9wdGlvbnMuaG92ZXIpIHtcbiAgICAgICAgICAgICAgICBmdW5jID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoYm94ZXMuZXEoYm94ZXMubGVuZ3RoIC0gMSkucG9zaXRpb24oKVtwcm9wLnZdICsgYm94ZXMuZXEoYm94ZXMubGVuZ3RoIC0gMSlbcHJvcC50XSgpXG4gICAgICAgICAgICAgICAgICAgICAgICA+ICQoZWxtKVtwcm9wLnRdKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uQm94ZXMoLShvcHRpb25zLm1vdmUpKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChvcHRpb25zLmVuZGxlc3MpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBuZXdCb3ggPSBib3hlcy5lcSgwKS5jbG9uZSgpLmFkZENsYXNzKFwiY2xvbmVcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICAkKGVsbSkuYXBwZW5kKG5ld0JveCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBib3hlcy5lcSgwKS5yZW1vdmUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJveGVzID0gJChlbG0pLmZpbmQoXCIudWktZmlsbXN0cmlwLWJveFwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uQm94ZXMoLShvcHRpb25zLm1vdmUpKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgdGltZXIgPSBzZXRJbnRlcnZhbChmdW5jLCBvcHRpb25zLmludGVydmFsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgY2xpY2s6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIG9wdGlvbnMuY2xpY2tNb3ZlID0gJGVsbVtwcm9wLnRdKCkgLyAyO1xuICAgICAgICAgICAgdmFyIHMgPSAoYm94ZXMuZXEoYm94ZXMubGVuZ3RoIC0gMSkucG9zaXRpb24oKVtwcm9wLnZdICsgYm94ZXMuZXEoYm94ZXMubGVuZ3RoIC0gMSlbcHJvcC50XSgpIC0gJChlbG0pW3Byb3AudF0oKSk7XG4gICAgICAgICAgICBpZiAocyA+PSBvcHRpb25zLmNsaWNrTW92ZSkge1xuICAgICAgICAgICAgICAgIHBvc2l0aW9uQm94ZXMoLShvcHRpb25zLmNsaWNrTW92ZSksIHRydWUpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChzID09IDApIHtcblxuICAgICAgICAgICAgfSBlbHNlIGlmIChzID4gMCkge1xuICAgICAgICAgICAgICAgIHBvc2l0aW9uQm94ZXMoLShzKSwgdHJ1ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIG1vdXNlbGVhdmU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmIChvcHRpb25zLmhvdmVyKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRpbWVyKSB7XG4gICAgICAgICAgICAgICAgICAgIGNsZWFySW50ZXJ2YWwodGltZXIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0pO1xuICAgIGxlZnQub24oe1xuICAgICAgICBtb3VzZWVudGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAob3B0aW9ucy5ob3Zlcikge1xuICAgICAgICAgICAgICAgIGZ1bmMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChib3hlcy5lcSgwKS5wb3NpdGlvbigpW3Byb3Audl0gPCAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbkJveGVzKG9wdGlvbnMubW92ZSk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAob3B0aW9ucy5lbmRsZXNzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgbmV3Qm94ID0gYm94ZXMuZXEoYm94ZXMubGVuZ3RoIC0gMSkuY2xvbmUoKS5hZGRDbGFzcyhcImNsb25lXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGNzcyA9IHt9O1xuICAgICAgICAgICAgICAgICAgICAgICAgY3NzW3Byb3Audl0gPSBib3hlcy5lcSgwKS5wb3NpdGlvbigpW3Byb3Audl0gLSBib3hlcy5lcShib3hlcy5sZW5ndGggLSAxKVtwcm9wLnRdKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBuZXdCb3guY3NzKGNzcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAkKGVsbSkucHJlcGVuZChuZXdCb3gpO1xuICAgICAgICAgICAgICAgICAgICAgICAgYm94ZXMuZXEoYm94ZXMubGVuZ3RoIC0gMSkucmVtb3ZlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBib3hlcyA9ICQoZWxtKS5maW5kKFwiLnVpLWZpbG1zdHJpcC1ib3hcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbkJveGVzKG9wdGlvbnMubW92ZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIHRpbWVyID0gc2V0SW50ZXJ2YWwoZnVuYywgb3B0aW9ucy5pbnRlcnZhbCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIG1vdXNlbGVhdmU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmIChvcHRpb25zLmhvdmVyKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRpbWVyKSB7XG4gICAgICAgICAgICAgICAgICAgIGNsZWFySW50ZXJ2YWwodGltZXIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgY2xpY2s6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIG9wdGlvbnMuY2xpY2tNb3ZlID0gJGVsbVtwcm9wLnRdKCkgLyAyO1xuICAgICAgICAgICAgdmFyIHMgPSBib3hlcy5lcSgwKS5wb3NpdGlvbigpW3Byb3Audl07XG4gICAgICAgICAgICBpZiAocyA9PSAwKSB7XG5cbiAgICAgICAgICAgIH0gZWxzZSBpZiAoLShzKSA+PSBvcHRpb25zLmNsaWNrTW92ZSkge1xuICAgICAgICAgICAgICAgIHBvc2l0aW9uQm94ZXMob3B0aW9ucy5jbGlja01vdmUsIHRydWUpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBwb3NpdGlvbkJveGVzKC0ocyksIHRydWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSk7XG4gICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJlc2l6ZSgpO1xuICAgIH0sIDUwKTtcbn1cblxuJC5mbi51aVNjcm9sbGFibGVGaWxtc3RyaXAgPSBmdW5jdGlvbiAob3B0aW9ucykge1xuXG4gICAgcmV0dXJuIHRoaXMuZWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgIG5ldyBTY3JvbGxhYmxlRmlsbXN0cmlwKHRoaXMsIG9wdGlvbnMpO1xuICAgIH0pO1xufTtcblxuXG4iLCJ2YXIgcGFyc2VEYXRhID0gcmVxdWlyZShcIi4uL3V0aWxzL3BhcnNlRGF0YVwiKTtcbiQuZm4udWlTZWxlY3QgPSBmdW5jdGlvbiAob3B0aW9uczEpIHtcbiAgICByZXR1cm4gdGhpcy5lYWNoKGZ1bmN0aW9uICgpIHtcblxuICAgICAgICB2YXIgb3B0aW9ucyA9ICQuZXh0ZW5kKHtcbiAgICAgICAgICAgIG1lbnU6IHBhcnNlRGF0YS5nZXRCb29sZWFuKHRoaXMsIFwibWVudVwiLCBmYWxzZSksXG4gICAgICAgICAgICBvdmVybGF5OiBwYXJzZURhdGEuZ2V0Qm9vbGVhbih0aGlzLCBcIm92ZXJsYXlcIiwgZmFsc2UpXG4gICAgICAgIH0sIG9wdGlvbnMxKTtcblxuICAgICAgICB2YXIgZWxtID0gdGhpcywgJGVsbSA9ICQoZWxtKTtcbiAgICAgICAgdmFyIHNlbGVjdCA9ICQoXCJzZWxlY3RcIiwgJGVsbSksXG4gICAgICAgICAgICBzZWxlY3RWYWx1ZSA9ICQoXCIudWktc2VsZWN0LXZhbHVlXCIsICRlbG0pLCB1bDtcbiAgICAgICAgaWYgKHNlbGVjdFZhbHVlLnNpemUoKSA9PSAwKSB7XG4gICAgICAgICAgICBzZWxlY3RWYWx1ZSA9ICQoJzxzcGFuIGNsYXNzPVwidWktc2VsZWN0LXZhbHVlXCI+PC9zcGFuPicpO1xuICAgICAgICAgICAgJGVsbS5hcHBlbmQoc2VsZWN0VmFsdWUpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzZWxlY3Quc2l6ZSgpID09IDApIHtcbiAgICAgICAgICAgIHNlbGVjdCA9ICQoJzxzZWxlY3Q+Jyk7XG4gICAgICAgICAgICBzZWxlY3QuYXBwZW5kKCc8b3B0aW9uPjwvb3B0aW9uPicpO1xuICAgICAgICAgICAgc2VsZWN0LmFwcGVuZFRvKCRlbG0pO1xuICAgICAgICB9XG5cbiAgICAgICAgc2VsZWN0LmNzcyh7b3BhY2l0eTogMH0pO1xuICAgICAgICBmdW5jdGlvbiBpc0luc2lkZSh4LCB5KSB7XG4gICAgICAgICAgICB2YXIgd2lkdGggPSAkZWxtLm91dGVyV2lkdGgoKSxcbiAgICAgICAgICAgICAgICBoZWlnaHQgPSAkZWxtLm91dGVySGVpZ2h0KCksXG4gICAgICAgICAgICAgICAgdG9wID0gJGVsbS5vZmZzZXQoKS50b3AsXG4gICAgICAgICAgICAgICAgbGVmdCA9ICRlbG0ub2Zmc2V0KCkubGVmdDtcbiAgICAgICAgICAgIHJldHVybiB4ID49IGxlZnQgJiYgeCA8PSBsZWZ0ICsgd2lkdGggJiYgeSA+PSB0b3AgJiYgeSA8PSB0b3AgKyBoZWlnaHQ7XG4gICAgICAgIH1cblxuICAgICAgICBzZWxlY3QuY3NzKHtsZWZ0OiAwLCB0b3A6IDB9KTtcbiAgICAgICAgJGVsbS5vbih7XG4gICAgICAgICAgICBtb3VzZW1vdmU6IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAgICAgaWYgKGlzSW5zaWRlKGUucGFnZVgsIGUucGFnZVkpKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBvID0gJGVsbS5vZmZzZXQoKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHggPSAoZS5wYWdlWCAtIG8ubGVmdCkgLSAxNSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHkgPSAoZS5wYWdlWSAtIG8udG9wKSAtIDE1O1xuLy8gICAgICAgICAgICAgICAgICAgIHNlbGVjdC5jc3Moe2xlZnQ6eCArIFwicHhcIiwgdG9wOnkgKyBcInB4XCJ9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG5cbiAgICAgICAgZnVuY3Rpb24gc2hvd092ZXJsYXkoKSB7XG4gICAgICAgICAgICB1bCA9ICQoXCI8dWw+PC91bD5cIik7XG4gICAgICAgICAgICB2YXIgb3B0aW9uc0VsbSA9IHNlbGVjdC5maW5kKFwib3B0aW9uXCIpO1xuICAgICAgICAgICAgb3B0aW9uc0VsbS5lYWNoKGZ1bmN0aW9uIChpKSB7XG4gICAgICAgICAgICAgICAgdmFyIG9wdCA9ICQodGhpcyk7XG4gICAgICAgICAgICAgICAgdmFyIHRleHQgPSBvcHQudGV4dCgpO1xuICAgICAgICAgICAgICAgIGlmIChvcHQuZGF0YShcImh0bWxcIikpIHtcbiAgICAgICAgICAgICAgICAgICAgdGV4dCA9IG9wdC5kYXRhKFwiaHRtbFwiKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdmFyIGxpID0gJChcIjxsaT5cIikuYXBwZW5kVG8odWwpLmh0bWwodGV4dCkuZGF0YShcImluZFwiLCBpKTtcbiAgICAgICAgICAgICAgICBpZiAob3B0LmlzKFwiOnNlbGVjdGVkXCIpKSB7XG4gICAgICAgICAgICAgICAgICAgIGxpLmFkZENsYXNzKFwic2VsZWN0ZWRcIik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB1bC5vbih7XG4gICAgICAgICAgICAgICAgbW91c2Vkb3duOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBpbmQgPSAkKHRoaXMpLmRhdGEoXCJpbmRcIik7XG4gICAgICAgICAgICAgICAgICAgIG9wdGlvbnNFbG0ucHJvcChcInNlbGVjdGVkXCIsIGZhbHNlKS5lcShpbmQpLnByb3AoXCJzZWxlY3RlZFwiLCB0cnVlKTtcbiAgICAgICAgICAgICAgICAgICAgc2VsZWN0LnRyaWdnZXIoXCJjaGFuZ2VcIik7XG4gICAgICAgICAgICAgICAgICAgIHVsLnRyaWdnZXIoXCJvdmVybGF5TWVudS5oaWRlXCIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sIFwibGlcIik7XG4gICAgICAgICAgICB1bC5vbih7XG4gICAgICAgICAgICAgICAgXCJvdmVybGF5TWVudS5oaWRlXCI6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG9wdCA9IHNlbGVjdC5maW5kKFwiOnNlbGVjdGVkXCIpO1xuICAgICAgICAgICAgICAgICAgICB1bCA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgICRlbG0ucmVtb3ZlQ2xhc3MoXCJmb2N1c1wiKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHVsLnVpT3ZlcmxheU1lbnUoe1xuICAgICAgICAgICAgICAgIHRhcmdldDogJGVsbSxcbiAgICAgICAgICAgICAgICB4OiAkZWxtLm9mZnNldCgpLmxlZnQgKyBcInB4XCIsXG4gICAgICAgICAgICAgICAgeTogJGVsbS5vZmZzZXQoKS50b3AgKyAkZWxtLm91dGVySGVpZ2h0KHRydWUpICsgXCJweFwiXG4gICAgICAgICAgICB9KS5wYXJlbnQoKS5hZGRDbGFzcyhcInVpLXNlbGVjdC1tZW51XCIpO1xuICAgICAgICAgICAgJGVsbS5hZGRDbGFzcyhcImZvY3VzXCIpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKG9wdGlvbnMub3ZlcmxheSkge1xuICAgICAgICAgICAgc2VsZWN0LmhpZGUoKTtcblxuICAgICAgICAgICAgJGVsbS5vbih7XG4gICAgICAgICAgICAgICAgbW91c2Vkb3duOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh1bCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdWwudHJpZ2dlcihcIm92ZXJsYXlNZW51LmhpZGVcIik7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzaG93T3ZlcmxheSgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiB1cGRhdGVVaSgpIHtcbiAgICAgICAgICAgIHZhciBvcHRpb24gPSBzZWxlY3QuZmluZChcIm9wdGlvbjpzZWxlY3RlZFwiKTtcbiAgICAgICAgICAgIHZhciB0ZXh0ID0gb3B0aW9uLnRleHQoKTtcbiAgICAgICAgICAgIGlmIChvcHRpb24uZGF0YShcImh0bWxcIikpIHtcbiAgICAgICAgICAgICAgICB0ZXh0ID0gb3B0aW9uLmRhdGEoXCJodG1sXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc2VsZWN0VmFsdWUuaHRtbCh0ZXh0KTtcbiAgICAgICAgfVxuXG5cbiAgICAgICAgdXBkYXRlVWkoKTtcbiAgICAgICAgc2VsZWN0Lm9uKHtcbiAgICAgICAgICAgIGNoYW5nZTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHVwZGF0ZVVpKCk7XG4gICAgICAgICAgICAgICAgaWYgKG9wdGlvbnMubWVudSkge1xuICAgICAgICAgICAgICAgICAgICBsb2NhdGlvbi5ocmVmID0gc2VsZWN0LnZhbCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmb2N1czogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICRlbG0uYWRkQ2xhc3MoXCJmb2N1c1wiKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBibHVyOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgJGVsbS5yZW1vdmVDbGFzcyhcImZvY3VzXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgJGVsbS5vbih7XG4gICAgICAgICAgICB1cGRhdGVVaTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHVwZGF0ZVVpKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0pO1xufTtcblxuIiwiJC5mbi51aVNpdGVTY3JvbGwgPSBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgIG9wdGlvbnMgPSAkLmV4dGVuZCh7fSwgb3B0aW9ucyk7XG4gICAgcmV0dXJuIHRoaXMuZWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciAkZWxtID0gJCh0aGlzKTtcbiAgICAgICAgdmFyIFNDUk9MTEJBUl9XSURUSCA9IHJlcXVpcmUoXCIuL21ldHJpY3NcIikuZ2V0U2Nyb2xsQmFyV2lkdGgoKTtcbiAgICAgICAgdmFyIHNjcm9sbFRvcCA9ICQod2luZG93KS5zY3JvbGxUb3AoKTtcbiAgICAgICAgLy8gdmFyIG92ZXJsYXkgPSAkKCc8ZGl2PicpLmNzcyh7XG4gICAgICAgIC8vICAgICBwb3NpdGlvbjogXCJmaXhlZFwiLFxuICAgICAgICAvLyAgICAgaGVpZ2h0OiBcIjEwMHZoXCIsXG4gICAgICAgIC8vICAgICB3aWR0aDogXCIxMDB2d1wiLFxuICAgICAgICAvLyAgICAgdG9wOiAwLFxuICAgICAgICAvLyAgICAgbGVmdDogMCxcbiAgICAgICAgLy8gICAgIG92ZXJmbG93OiBcInNjcm9sbFwiLFxuICAgICAgICAvLyAgICAgZGlzcGxheTogXCJub25lXCIsXG4gICAgICAgIC8vICAgICBiYWNrZ3JvdW5kOiBcInJnYmEoMCwgMCwgMCwgMC41KVwiLFxuICAgICAgICAvLyAgICAgekluZGV4OiA5OVxuICAgICAgICAvLyB9KS5hcHBlbmRUbyhcImJvZHlcIik7XG4gICAgICAgICQoXCIudWktc2l0ZVNjcm9sbC1wYWdlXCIpLmNzcyh7bWluSGVpZ2h0OiBcIjEwMHZoXCJ9KTtcbiAgICAgICAgdmFyIGRpcmVjdGlvbiA9IDE7XG5cbiAgICAgICAgdmFyIHNsaWRlID0gLTE7XG4gICAgICAgIHZhciBidW1wID0gMDtcbiAgICAgICAgdmFyIGFuaW1hdGluZyA9IGZhbHNlO1xuXG4gICAgICAgIGZ1bmN0aW9uIGdvVG9TbGlkZShlcSkge1xuXG4gICAgICAgICAgICAvLyBvdmVybGF5LnNob3coKTtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKFwic2xpZGUgXCIgKyBzbGlkZSArIFwiID4gXCIgKyBlcSk7XG4gICAgICAgICAgICB2YXIgcGFnZXMgPSAkKFwiLnVpLXNpdGVTY3JvbGwtcGFnZVwiKTtcbiAgICAgICAgICAgIHZhciBzaXplID0gcGFnZXMubGVuZ3RoO1xuICAgICAgICAgICAgdmFyIHBhZ2UgPSBwYWdlcy5lcShlcSk7XG4gICAgICAgICAgICBpZiAoZXEgPT09IC0xIHx8IHBhZ2UubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIHRvcCA9IHBhZ2UucG9zaXRpb24oKS50b3A7XG4gICAgICAgICAgICB2YXIgaGVpZ2h0ID0gcGFnZS5vdXRlckhlaWdodChmYWxzZSk7XG4gICAgICAgICAgICB2YXIgd2ggPSAkKHdpbmRvdykuaGVpZ2h0KCk7XG4gICAgICAgICAgICBpZiAoZXEgPT09IHNsaWRlKSB7XG4gICAgICAgICAgICAgICAgYnVtcCA9IDA7XG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coXCJnb3Rvc2xpZGVcIiwgZXEsIHNjcm9sbFRvcCA8IHRvcCwgc2Nyb2xsVG9wID4gdG9wICsgaGVpZ2h0IC0gd2gpO1xuICAgICAgICAgICAgICAgIGlmIChzY3JvbGxUb3AgPCB0b3ApIHtcbiAgICAgICAgICAgICAgICAgICAgc2Nyb2xsQW5pbWF0ZSh0b3ApO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoc2Nyb2xsVG9wID4gdG9wICsgaGVpZ2h0IC0gd2gpIHtcbiAgICAgICAgICAgICAgICAgICAgc2Nyb2xsQW5pbWF0ZSh0b3AgKyBoZWlnaHQgLSB3aCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBzbGlkZSA9IGVxO1xuICAgICAgICAgICAgICAgIGJ1bXAgPSAwO1xuICAgICAgICAgICAgICAgIHZhciBzdCA9IHRvcDtcbiAgICAgICAgICAgICAgICBpZiAoZGlyZWN0aW9uIDwgMCAmJiBzbGlkZSA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgc3QgKz0gaGVpZ2h0IC0gd2g7XG4gICAgICAgICAgICAgICAgICAgIGlmIChoZWlnaHQgPiB3aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYnVtcCA9IHRvcDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhoZWlnaHQgLSAkKHdpbmRvdykuaGVpZ2h0KCkpXG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChkaXJlY3Rpb24gPiAwICYmIHNsaWRlIDwgc2l6ZSAtIDEpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGhlaWdodCA+IHdoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBidW1wID0gdG9wICsgaGVpZ2h0IC0gd2g7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgc2Nyb2xsQW5pbWF0ZShzdCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGdldFNsaWRlQWZ0ZXJTY3JvbGwoKSB7XG4gICAgICAgICAgICAvLyBhbmltYXRpbmcgPSB0cnVlO1xuXG4gICAgICAgICAgICB2YXIgc2ggPSAkKHdpbmRvdykuaGVpZ2h0KCk7XG4gICAgICAgICAgICB2YXIgcGFnZUZvdW5kID0gZmFsc2U7XG4gICAgICAgICAgICAkKFwiLnVpLXNpdGVTY3JvbGwtcGFnZVwiKS5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB2YXIgdG9wID0gJCh0aGlzKS5wb3NpdGlvbigpLnRvcDtcbiAgICAgICAgICAgICAgICB2YXIgaGVpZ2h0ID0gJCh0aGlzKS5vdXRlckhlaWdodChmYWxzZSk7XG4gICAgICAgICAgICAgICAgaWYgKGRpcmVjdGlvbiA9PT0gMSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhcImRpcmVjdGlvblwiLCB7ZGlyZWN0aW9uOiBkaXJlY3Rpb24sIGhlaWdodDogaGVpZ2h0LCB0b3A6IHRvcCwgc2Nyb2xsVG9wOiBzY3JvbGxUb3B9KTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHNjcm9sbFRvcCArIHNoID4gdG9wICYmIHNjcm9sbFRvcCA8IHRvcCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coXCJnZXRTbGlkZUFmdGVyU2Nyb2xsXCIsICQodGhpcykuZmluZChcIi5wYWdlTnVtYmVyXCIpLnRleHQoKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBnb1RvU2xpZGUoJCh0aGlzKS5pbmRleChcIi51aS1zaXRlU2Nyb2xsLXBhZ2VcIikpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcGFnZUZvdW5kID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKFwiZGlyZWN0aW9uXCIsIHtkaXJlY3Rpb246IGRpcmVjdGlvbiwgaGVpZ2h0OiBoZWlnaHQsIHRvcDogdG9wLCBzY3JvbGxUb3A6IHNjcm9sbFRvcH0pO1xuICAgICAgICAgICAgICAgICAgICBpZiAoc2Nyb2xsVG9wICsgc2ggPiB0b3AgKyBoZWlnaHQgJiYgc2Nyb2xsVG9wIDwgdG9wICsgaGVpZ2h0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhcImdldFNsaWRlQWZ0ZXJTY3JvbGxcIiwgJCh0aGlzKS5maW5kKFwiLnBhZ2VOdW1iZXJcIikudGV4dCgpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGdvVG9TbGlkZSgkKHRoaXMpLmluZGV4KFwiLnVpLXNpdGVTY3JvbGwtcGFnZVwiKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBwYWdlRm91bmQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGlmICghcGFnZUZvdW5kKSB7XG4gICAgICAgICAgICAgICAgLy8gYW5pbWF0aW5nID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBzZXRJbnRlcnZhbChnZXRTbGlkZUFmdGVyU2Nyb2xsLCA1MCk7XG5cbiAgICAgICAgZnVuY3Rpb24gc2Nyb2xsQW5pbWF0ZShzdCkge1xuICAgICAgICAgICAgaWYgKHRtKSB7XG4gICAgICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHRtKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIGlmIChhbmltYXRpbmcpIHtcbiAgICAgICAgICAgIC8vICAgICByZXR1cm47XG4gICAgICAgICAgICAvLyB9XG4gICAgICAgICAgICBhbmltYXRpbmcgPSB0cnVlO1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coXCJhbmltYXRlXCIsIHt0b3A6IHN0LCBzY3JvbGxUb3A6IHNjcm9sbFRvcCwgYnVtcDogYnVtcCwgZGlyZWN0aW9uOiBkaXJlY3Rpb259LCBzdCwgc2Nyb2xsVG9wKTtcbiAgICAgICAgICAgIHZhciBodG1sQm9keSA9ICQoXCJodG1sLCBib2R5XCIpO1xuICAgICAgICAgICAgLy8gJCh3aW5kb3cpLmNzcyh7cGFkZGluZ1JpZ2h0OiBTQ1JPTExCQVJfV0lEVEggKyBcInB4XCIsIG92ZXJmbG93OiBcImhpZGRlblwifSk7XG4gICAgICAgICAgICBUd2VlbkxpdGUua2lsbFR3ZWVuc09mKHdpbmRvdyk7XG4gICAgICAgICAgICBUd2VlbkxpdGUudG8od2luZG93LCBNYXRoLm1pbihNYXRoLmFicyhzdCAtIHNjcm9sbFRvcCkgKiAxLjIgLyAxMDAwLCAyKSwge1xuICAgICAgICAgICAgICAgIGVhc2U6IFBvd2VyMi5lYXNlT3V0LFxuICAgICAgICAgICAgICAgIHNjcm9sbFRvOiBzdCwgb25Db21wbGV0ZTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhcImFuaW1hdGlvbiBzdG9wXCIpO1xuXG4gICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coXCJhbmltYXRpb24gcmVsZWFzZWRcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICBhbmltYXRpbmcgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vICQod2luZG93KS5jc3Moe3BhZGRpbmdSaWdodDogXCJcIiwgb3ZlcmZsb3c6IFwiXCJ9KTtcbiAgICAgICAgICAgICAgICAgICAgfSwgNTApXG5cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgLy8gLmFuaW1hdGUoe3Njcm9sbFRvcDogc3QgKyBcInB4XCJ9LFxuICAgICAgICAgICAgLy8gICAgIE1hdGguYWJzKHN0IC0gc2Nyb2xsVG9wKSAqIDYsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIC8vICAgICAgICAgLy8gb3ZlcmxheS5oaWRlKCk7XG4gICAgICAgICAgICAvLyAgICAgICAgICQoXCJib2R5XCIpLmNzcyh7cGFkZGluZ1JpZ2h0OiBcIlwifSk7XG4gICAgICAgICAgICAvLyAgICAgICAgIGh0bWxCb2R5LmNzcyh7XG4gICAgICAgICAgICAvLyAgICAgICAgICAgICBvdmVyZmxvdzogXCJcIlxuICAgICAgICAgICAgLy8gICAgICAgICB9KTtcbiAgICAgICAgICAgIC8vICAgICAgICAgY29uc29sZS5sb2coXCJhbmltYXRpb24gc3RvcFwiKTtcbiAgICAgICAgICAgIC8vICAgICAgICAgYW5pbWF0aW5nID0gZmFsc2U7XG4gICAgICAgICAgICAvLyAgICAgfSlcbiAgICAgICAgfVxuXG5cbiAgICAgICAgc2V0SW50ZXJ2YWwoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIHN0ID0gJCh3aW5kb3cpLnNjcm9sbFRvcCgpO1xuICAgICAgICAgICAgaWYgKHN0ID09PSBzY3JvbGxUb3ApIHtcbiAgICAgICAgICAgICAgICBnb1RvU2xpZGUoc2xpZGUpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChzdCA+PSBzY3JvbGxUb3ApIHtcbiAgICAgICAgICAgICAgICBpZiAoZGlyZWN0aW9uID09PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICBidW1wID0gMDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZGlyZWN0aW9uID0gMTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKGRpcmVjdGlvbiA9PT0gMSkge1xuICAgICAgICAgICAgICAgICAgICBidW1wID0gMDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZGlyZWN0aW9uID0gLTE7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzY3JvbGxUb3AgPSBzdDtcbiAgICAgICAgICAgIGlmICh0bSkge1xuICAgICAgICAgICAgICAgIGNsZWFyVGltZW91dCh0bSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoYnVtcCA+IDApIHtcblxuICAgICAgICAgICAgICAgIGlmIChkaXJlY3Rpb24gPT09IC0xICYmIGJ1bXAgPiBzY3JvbGxUb3ApIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coXCJidW1wIC0xXCIsIHtkaXJlY3Rpb246IGRpcmVjdGlvbiwgYnVtcDogYnVtcCwgc2Nyb2xsVG9wOiBzY3JvbGxUb3B9KTtcbiAgICAgICAgICAgICAgICAgICAgLy8gYW5pbWF0aW5nID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgc2Nyb2xsQW5pbWF0ZShidW1wKTtcbiAgICAgICAgICAgICAgICAgICAgYnVtcCA9IDA7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGRpcmVjdGlvbiA9PT0gMSAmJiBidW1wIDwgc2Nyb2xsVG9wKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKFwiYnVtcCAxXCIsIHtkaXJlY3Rpb246IGRpcmVjdGlvbiwgYnVtcDogYnVtcCwgc2Nyb2xsVG9wOiBzY3JvbGxUb3B9KTtcbiAgICAgICAgICAgICAgICAgICAgLy8gYW5pbWF0aW5nID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgc2Nyb2xsQW5pbWF0ZShidW1wKTtcbiAgICAgICAgICAgICAgICAgICAgYnVtcCA9IDA7XG5cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coXCJzZXQgdG1cIiwgYnVtcCk7XG4gICAgICAgICAgICAvLyBpZiAoIWFuaW1hdGluZyl7XG4gICAgICAgICAgICB0bSA9IHNldFRpbWVvdXQoZ2V0U2xpZGVBZnRlclNjcm9sbCwgNTApO1xuICAgICAgICB9LCAxMDApO1xuICAgICAgICB2YXIgdG07XG4gICAgICAgICQod2luZG93KS5vbihcInNjcm9sbFwiLCBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgaWYgKHRtKSB7XG4gICAgICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHRtKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIH1cblxuICAgICAgICB9KTtcblxuICAgICAgICB0bSA9IHNldFRpbWVvdXQoZ2V0U2xpZGVBZnRlclNjcm9sbCwgNTApO1xuICAgICAgICB2YXIgdWkgPSB7XG4gICAgICAgICAgICBnb1RvU2xpZGU6IGZ1bmN0aW9uIChzbGlkZSkge1xuICAgICAgICAgICAgICAgIGdvVG9TbGlkZShzbGlkZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgICRlbG0uZGF0YShcInVpXCIsIHVpKTtcblxuICAgIH0pO1xufTtcblxuXG4iLCJ2YXIgXyA9IHJlcXVpcmUoXCJ1bmRlcnNjb3JlXCIpO1xuZnVuY3Rpb24gZ2V0RGF0YU51bWJlcihlbG0sIHByb3AsIGRlZikge1xuICAgIHZhciB2YWwgPSBwYXJzZUludCgkKGVsbSkuZGF0YShwcm9wKSwgMTApO1xuICAgIHJldHVybiBpc05hTih2YWwpID8gZGVmIDogdmFsO1xufVxuXG5mdW5jdGlvbiBnZXREYXRhTnVtYmVyRmxvYXQoZWxtLCBwcm9wLCBkZWYpIHtcbiAgICB2YXIgdmFsID0gcGFyc2VGbG9hdCgkKGVsbSkuZGF0YShwcm9wKSwgMTApO1xuICAgIHJldHVybiBpc05hTih2YWwpID8gZGVmIDogdmFsO1xufVxuXG5mdW5jdGlvbiBnZXREYXRhQm9sKGVsbSwgcHJvcCwgZGVmKSB7XG4gICAgdmFyIHZhbCA9ICQoZWxtKS5kYXRhKHByb3ApO1xuICAgIHJldHVybiB2YWwgPT0gXCJ0cnVlXCIgfHwgdmFsID09IFwiMVwiO1xufVxuXG5mdW5jdGlvbiBTbGlkZXIoZWxtLCBvcHRpb25zKSB7XG4gICAgb3B0aW9ucy5kZWNpbWFscyA9IGdldERhdGFOdW1iZXIoZWxtLCBcImRlY2ltYWxzXCIsIGZhbHNlKTtcbiAgICBvcHRpb25zID0gJC5leHRlbmQoe1xuICAgICAgICBtaW46IG9wdGlvbnMuZGVjaW1hbHMgPyBnZXREYXRhTnVtYmVyRmxvYXQoZWxtLCBcIm1pblwiLCAwKSAqIE1hdGgucG93KDEwLCBvcHRpb25zLmRlY2ltYWxzKSA6IGdldERhdGFOdW1iZXIoZWxtLCBcIm1pblwiLCAwKSxcbiAgICAgICAgbWF4OiBvcHRpb25zLmRlY2ltYWxzID8gZ2V0RGF0YU51bWJlckZsb2F0KGVsbSwgXCJtYXhcIiwgMTAwKSAqIE1hdGgucG93KDEwLCBvcHRpb25zLmRlY2ltYWxzKSA6IGdldERhdGFOdW1iZXIoZWxtLCBcIm1heFwiLCAxMDApLFxuICAgICAgICBsZWZ0VmFsOiBvcHRpb25zLmRlY2ltYWxzID8gZ2V0RGF0YU51bWJlckZsb2F0KGVsbSwgXCJsZWZ0dmFsXCIsIDApICogTWF0aC5wb3coMTAsIG9wdGlvbnMuZGVjaW1hbHMpIDogZ2V0RGF0YU51bWJlcihlbG0sIFwibGVmdHZhbFwiLCAwKSxcbiAgICAgICAgcmlnaHRWYWw6IG9wdGlvbnMuZGVjaW1hbHMgPyBnZXREYXRhTnVtYmVyRmxvYXQoZWxtLCBcInJpZ2h0dmFsXCIsIDApICogTWF0aC5wb3coMTAsIG9wdGlvbnMuZGVjaW1hbHMpIDogZ2V0RGF0YU51bWJlcihlbG0sIFwicmlnaHR2YWxcIiwgMCksXG4gICAgICAgIHNwZWVkOiAwLjUsXG4gICAgICAgIHVuaXQ6IFwiXCIsXG4gICAgICAgIHJ1bGVyOiBnZXREYXRhQm9sKGVsbSwgXCJydWxlclwiLCBmYWxzZSksXG4gICAgICAgIG1vdmVSaWdodDogZ2V0RGF0YUJvbChlbG0sIFwibW92ZXJpZ2h0XCIsIGZhbHNlKVxuICAgIH0sIG9wdGlvbnMpO1xuICAgIHZhciAkZWxtID0gJChlbG0pLCAkY29udGVudCA9ICRlbG0uZmluZChcIi51aS1zbGlkZXItY29udGVudFwiKSxcbiAgICAgICAgJGxlZnQgPSAkZWxtLmZpbmQoXCIudWktc2xpZGVyLWxlZnRcIiksXG4gICAgICAgICRyaWdodCA9ICRlbG0uZmluZChcIi51aS1zbGlkZXItcmlnaHRcIiksXG4gICAgICAgICR0aWNrcyA9ICRlbG0uZmluZChcIi51aS1zbGlkZXItdGlja1wiKSxcbiAgICAgICAgd2lkdGggPSAkZWxtLmZpbmQoXCIudWktc2xpZGVyLWhvbGRlclwiKS53aWR0aCgpO1xuICAgIGlmICgkZWxtLmRhdGEoXCJ1bml0XCIpKSB7XG4gICAgICAgIG9wdGlvbnMudW5pdCA9ICRlbG0uZGF0YShcInVuaXRcIik7XG4gICAgfVxuICAgICRlbG0uYWRkQ2xhc3MoXCJ1aS1zbGlkZXItdjJcIik7XG5cbiAgICBmdW5jdGlvbiBjaGVja0RlY2ltYWxzKG51bSwgdHlwZSkge1xuICAgICAgICByZXR1cm4gb3B0aW9ucy5kZWNpbWFscyA/IG51bSAvIE1hdGgucG93KDEwLCBvcHRpb25zLmRlY2ltYWxzKSA6IG51bTtcbiAgICB9XG5cbiAgICBpZiAob3B0aW9ucy5ydWxlcikge1xuICAgICAgICB2YXIgJHJ1bGVyID0gJCgnPGRpdiBjbGFzcz1cInVpLXNsaWRlci1ydWxlclwiPjwvZGl2PicpO1xuICAgICAgICB2YXIgaGFsZiA9IHdpZHRoIC8gMjtcbiAgICAgICAgJHJ1bGVyLmFwcGVuZCgnPGRpdiBjbGFzcz1cInVpLXNsaWRlci1ydWxlci1tYXJrIGZpcnN0XCI+JyArIGdldFZhbHVlKDApICsgJzwvZGl2PicpO1xuICAgICAgICAkcnVsZXIuYXBwZW5kKCc8ZGl2IGNsYXNzPVwidWktc2xpZGVyLXJ1bGVyLW1hcmsgc2Vjb25kXCI+JyArIGNoZWNrRGVjaW1hbHMoZ2V0VmFsdWUoaGFsZiAvIDIpKSArICc8L2Rpdj4nKTtcbiAgICAgICAgJHJ1bGVyLmFwcGVuZCgnPGRpdiBjbGFzcz1cInVpLXNsaWRlci1ydWxlci1tYXJrIG1pZGRsZVwiPicgKyBjaGVja0RlY2ltYWxzKGdldFZhbHVlKGhhbGYpKSArICc8L2Rpdj4nKTtcbiAgICAgICAgJHJ1bGVyLmFwcGVuZCgnPGRpdiBjbGFzcz1cInVpLXNsaWRlci1ydWxlci1tYXJrIGZvcnRoXCI+JyArIGNoZWNrRGVjaW1hbHMoZ2V0VmFsdWUoaGFsZiArIGhhbGYgLyAyKSkgKyAnPC9kaXY+Jyk7XG4gICAgICAgICRydWxlci5hcHBlbmQoJzxkaXYgY2xhc3M9XCJ1aS1zbGlkZXItcnVsZXItbWFyayBsYXN0XCI+JyArIGNoZWNrRGVjaW1hbHMoZ2V0VmFsdWUod2lkdGgpKSArICc8L2Rpdj4nKTtcblxuICAgICAgICAkZWxtLmFwcGVuZCgkcnVsZXIpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdldFZhbHVlKGwxKSB7XG4gICAgICAgIHJldHVybiBvcHRpb25zLm1pbiArIE1hdGgucm91bmQobDEgLyB3aWR0aCAqIChvcHRpb25zLm1heCAtIG9wdGlvbnMubWluKSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gYm91bmRMZWZ0KGwxKSB7XG4gICAgICAgIGlmIChsMSA8IDApIHtcbiAgICAgICAgICAgIHJldHVybiAwO1xuICAgICAgICB9XG4gICAgICAgIGlmICgkcmlnaHQubGVuZ3RoKSB7XG4gICAgICAgICAgICB2YXIgbDIgPSAkcmlnaHQucG9zaXRpb24oKS5sZWZ0O1xuICAgICAgICAgICAgaWYgKGwxID4gbDIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbDI7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGwxID4gd2lkdGgpIHtcbiAgICAgICAgICAgIHJldHVybiB3aWR0aDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbDE7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2V0U25hcFgobDEpIHtcbiAgICAgICAgdmFyIGxlZnQsIGExLCBhMiA9IGZhbHNlLCB0aWNrO1xuICAgICAgICAkdGlja3MuZWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBhMSA9IE1hdGguYWJzKCQodGhpcykucG9zaXRpb24oKS5sZWZ0IC0gbDEpO1xuICAgICAgICAgICAgaWYgKGEyID09PSBmYWxzZSB8fCBhMSA8IGEyKSB7XG4gICAgICAgICAgICAgICAgdGljayA9IHRoaXM7XG4gICAgICAgICAgICAgICAgbGVmdCA9ICQodGhpcykucG9zaXRpb24oKS5sZWZ0O1xuICAgICAgICAgICAgICAgIGEyID0gYTE7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBpZiAoJHRpY2tzLmxlbmd0aCA9PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4ge2xlZnQ6IChnZXRWYWx1ZShsMSkgLSBvcHRpb25zLm1pbikgLyAob3B0aW9ucy5tYXggLSBvcHRpb25zLm1pbikgKiB3aWR0aH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4ge2xlZnQ6IGxlZnR9O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdldFNuYXAoJGhhbmRsZSkge1xuICAgICAgICByZXR1cm4gJC5leHRlbmQoe3RpY2s6ICRoYW5kbGV9LCBnZXRTbmFwWCgkaGFuZGxlLnBvc2l0aW9uKCkubGVmdCkpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGJvdW5kUmlnaHQobDEpIHtcbiAgICAgICAgaWYgKGwxID4gd2lkdGgpIHtcbiAgICAgICAgICAgIHJldHVybiB3aWR0aDtcbiAgICAgICAgfVxuICAgICAgICBpZiAoJGxlZnQubGVuZ3RoKSB7XG4gICAgICAgICAgICB2YXIgbDIgPSAkbGVmdC5wb3NpdGlvbigpLmxlZnQ7XG4gICAgICAgICAgICBpZiAobDEgPCBsMikge1xuICAgICAgICAgICAgICAgIHJldHVybiBsMjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAobDEgPCAwKSB7XG4gICAgICAgICAgICByZXR1cm4gMDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBsMTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiB1cGRhdGUoKSB7XG4gICAgICAgIHdpZHRoID0gJGVsbS5maW5kKFwiLnVpLXNsaWRlci1ob2xkZXJcIikud2lkdGgoKTtcbiAgICAgICAgdmFyIHZhbExlZnQgPSBvcHRpb25zLmRlY2ltYWxzID8gZ2V0RGF0YU51bWJlckZsb2F0KCRsZWZ0LCBcInZhbFwiLCBvcHRpb25zLm1pbikgKiBNYXRoLnBvdygxMCwgb3B0aW9ucy5kZWNpbWFscykgOiBnZXREYXRhTnVtYmVyKCRsZWZ0LCBcInZhbFwiLCBvcHRpb25zLm1pbiksXG4gICAgICAgICAgICBsZWZ0ID0gKHZhbExlZnQgLSBvcHRpb25zLm1pbiApIC8gKG9wdGlvbnMubWF4IC0gb3B0aW9ucy5taW4pICogd2lkdGgsXG4gICAgICAgICAgICB2YWxSaWdodCA9IG9wdGlvbnMuZGVjaW1hbHMgPyBnZXREYXRhTnVtYmVyRmxvYXQoJHJpZ2h0LCBcInZhbFwiLCBvcHRpb25zLm1heCkgKiBNYXRoLnBvdygxMCwgb3B0aW9ucy5kZWNpbWFscykgOiBnZXREYXRhTnVtYmVyKCRyaWdodCwgXCJ2YWxcIiwgb3B0aW9ucy5tYXgpLFxuICAgICAgICAgICAgcmlnaHQgPSAodmFsUmlnaHQgLSBvcHRpb25zLm1pbikgLyAob3B0aW9ucy5tYXggLSBvcHRpb25zLm1pbikgKiB3aWR0aDtcbiAgICAgICAgdmFyIHZhbDtcbiAgICAgICAgaWYgKCRsZWZ0Lmxlbmd0aCkge1xuICAgICAgICAgICAgJGxlZnQuY3NzKHtsZWZ0OiBsZWZ0ICsgXCJweFwifSk7XG4gICAgICAgICAgICB2YWwgPSBjaGVja0RlY2ltYWxzKE1hdGgucm91bmQodmFsTGVmdCkpO1xuICAgICAgICAgICAgJGxlZnQuZmluZChcIi51aS1zbGlkZXItbGFiZWxcIikudGV4dCh2YWwgKyBvcHRpb25zLnVuaXQpXG4gICAgICAgIH1cbiAgICAgICAgaWYgKCRyaWdodC5sZW5ndGgpIHtcbiAgICAgICAgICAgICRyaWdodC5jc3Moe2xlZnQ6IHJpZ2h0ICsgXCJweFwifSk7XG4gICAgICAgICAgICB2YWwgPSBjaGVja0RlY2ltYWxzKE1hdGgucm91bmQodmFsUmlnaHQpKTtcbiAgICAgICAgICAgICRyaWdodC5maW5kKFwiLnVpLXNsaWRlci1sYWJlbFwiKS50ZXh0KHZhbCArIG9wdGlvbnMudW5pdCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCRjb250ZW50Lmxlbmd0aCkge1xuICAgICAgICAgICAgJGNvbnRlbnQuY3NzKHtsZWZ0OiBsZWZ0ICsgXCJweFwiLCByaWdodDogd2lkdGggLSByaWdodCArIFwicHhcIn0pO1xuICAgICAgICB9XG4gICAgICAgICR0aWNrcy5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciB2YWwxID0gb3B0aW9ucy5kZWNpbWFscyA/IGdldERhdGFOdW1iZXJGbG9hdCh0aGlzLCBcInZhbFwiLCBvcHRpb25zLm1pbikgKiBNYXRoLnBvdygxMCwgb3B0aW9ucy5kZWNpbWFscykgOiBnZXREYXRhTnVtYmVyKHRoaXMsIFwidmFsXCIsIG9wdGlvbnMubWluKSxcbiAgICAgICAgICAgICAgICB2YWwyID0gKHZhbDEgLSBvcHRpb25zLm1pbiApIC8gKG9wdGlvbnMubWF4IC0gb3B0aW9ucy5taW4pICogd2lkdGg7XG4gICAgICAgICAgICAkKHRoaXMpLmNzcyh7bGVmdDogdmFsMiArIFwicHhcIn0pO1xuICAgICAgICAgICAgdmFsID0gY2hlY2tEZWNpbWFscyhNYXRoLnJvdW5kKHZhbDEpKTtcbiAgICAgICAgICAgICQodGhpcykuZmluZChcIi51aS1zbGlkZXItbGFiZWxcIikudGV4dCh2YWwgKyBvcHRpb25zLnVuaXQpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAkZWxtLm9uKHtcbiAgICAgICAgbW91c2Vkb3duOiBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgaWYgKCQoZS50YXJnZXQpLmNsb3Nlc3QoXCIudWktc2xpZGVyLXJpZ2h0LCAudWktc2xpZGVyLWxlZnRcIikuc2l6ZSgpID4gMCkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBsZWZ0ID0gZS5wYWdlWCAtICRlbG0uZmluZChcIi51aS1zbGlkZXItaG9sZGVyXCIpLm9mZnNldCgpLmxlZnQsIHNuYXA7XG4gICAgICAgICAgICBpZiAoJGxlZnQubGVuZ3RoICYmICFvcHRpb25zLm1vdmVSaWdodCkge1xuICAgICAgICAgICAgICAgIHNuYXAgPSBnZXRTbmFwWChsZWZ0KTtcbiAgICAgICAgICAgICAgICBsZWZ0ID0gc25hcC5sZWZ0O1xuICAgICAgICAgICAgICAgIFR3ZWVuTGl0ZS50bygkbGVmdCwgb3B0aW9ucy5zcGVlZCwge2Nzczoge2xlZnQ6IGxlZnQgKyBcInB4XCJ9LCBlYXNlOiBQb3dlcjIuZWFzZU91dH0pO1xuICAgICAgICAgICAgICAgIGlmICgkY29udGVudC5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgVHdlZW5MaXRlLnRvKCRjb250ZW50LCBvcHRpb25zLnNwZWVkLCB7Y3NzOiB7bGVmdDogbGVmdCArIFwicHhcIn0sIGVhc2U6IFBvd2VyMi5lYXNlT3V0fSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHNldFZhbHVlKCRsZWZ0LCBnZXRWYWx1ZShsZWZ0KSk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKCRyaWdodC5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBzbmFwID0gZ2V0U25hcFgobGVmdCk7XG4gICAgICAgICAgICAgICAgbGVmdCA9IHNuYXAubGVmdDtcbiAgICAgICAgICAgICAgICBUd2VlbkxpdGUudG8oJHJpZ2h0LCBvcHRpb25zLnNwZWVkLCB7Y3NzOiB7bGVmdDogbGVmdCArIFwicHhcIn0sIGVhc2U6IFBvd2VyMi5lYXNlT3V0fSk7XG4gICAgICAgICAgICAgICAgaWYgKCRjb250ZW50Lmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICBUd2VlbkxpdGUudG8oJGNvbnRlbnQsIG9wdGlvbnMuc3BlZWQsIHtjc3M6IHtyaWdodDogd2lkdGggLSBsZWZ0ICsgXCJweFwifSwgZWFzZTogUG93ZXIyLmVhc2VPdXR9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgc2V0VmFsdWUoJHJpZ2h0LCBnZXRWYWx1ZShsZWZ0KSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfVxuICAgIH0pO1xuXG5cbiAgICAkZWxtLmFkZENsYXNzKFwiZGVzdHJveVwiKS5vbih7XG4gICAgICAgIHVwZGF0ZVVpOiBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgIHVwZGF0ZSgpO1xuICAgICAgICB9LFxuICAgICAgICBkZXN0cm95OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkKHdpbmRvdykub2ZmKHtyZXNpemU6IHJlc2l6ZX0pO1xuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICBmdW5jdGlvbiByZXNpemUoKSB7XG4gICAgICAgIHVwZGF0ZSgpO1xuICAgIH1cbiAgICBcbiAgICB1cGRhdGUoKTtcblxuICAgICQod2luZG93KS5vbih7XG4gICAgICAgIHJlc2l6ZTogcmVzaXplXG4gICAgfSk7XG4gICAgZnVuY3Rpb24gc2V0VmFsdWUoJG5vZGUsIHZhbCwgbm9UcmlnZ2VyKSB7XG4gICAgICAgIGlmICgkbm9kZS5kYXRhKFwidmFsXCIpICE9PSB2YWwpIHtcbiAgICAgICAgICAgIGlmIChvcHRpb25zLmRlY2ltYWxzKSB7XG4gICAgICAgICAgICAgICAgdmFsID0gTWF0aC5yb3VuZCh2YWwpIC8gTWF0aC5wb3coMTAsIG9wdGlvbnMuZGVjaW1hbHMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgJG5vZGUuZGF0YShcInZhbFwiLCB2YWwpO1xuICAgICAgICAgICAgJG5vZGUuZmluZChcIi51aS1zbGlkZXItbGFiZWxcIikudGV4dCh2YWwgKyBvcHRpb25zLnVuaXQpO1xuICAgICAgICAgICAgaWYgKCFub1RyaWdnZXIpIHtcbiAgICAgICAgICAgICAgICAkbm9kZS50cmlnZ2VyKFwic2xpZGVyLmNoYW5nZVwiLCBbdmFsXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAkbGVmdC5vbk1vdXNlKHtcbiAgICAgICAgXCJtb3VzZS5zdGFydFwiOiBmdW5jdGlvbiAoZSwgcG9zKSB7XG4gICAgICAgICAgICBwb3MucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIHBvcy5kYXRhLmxlZnQgPSAkbGVmdC5wb3NpdGlvbigpLmxlZnQ7XG4gICAgICAgIH0sXG4gICAgICAgIFwibW91c2UubW92ZVwiOiBmdW5jdGlvbiAoZSwgcG9zKSB7XG4gICAgICAgICAgICB2YXIgZGlmZiA9IHBvcy5kaWZmKCk7XG4gICAgICAgICAgICB2YXIgbDEgPSBib3VuZExlZnQocG9zLmRhdGEubGVmdCArIGRpZmYueCk7XG4gICAgICAgICAgICAkbGVmdC5jc3Moe2xlZnQ6IGwxICsgXCJweFwifSk7XG4gICAgICAgICAgICBzZXRWYWx1ZSgkbGVmdCwgZ2V0VmFsdWUobDEpKTtcbiAgICAgICAgICAgIGlmICgkY29udGVudC5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAkY29udGVudC5jc3Moe2xlZnQ6IGwxICsgXCJweFwifSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIFwibW91c2Uuc3RvcFwiOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgc25hcCA9IGdldFNuYXAoJGxlZnQpO1xuICAgICAgICAgICAgaWYgKHNuYXAudGljaykge1xuICAgICAgICAgICAgICAgIHNldFZhbHVlKCRsZWZ0LCBnZXRWYWx1ZShzbmFwLmxlZnQpKTtcbiAgICAgICAgICAgICAgICBUd2VlbkxpdGUudG8odGhpcywgb3B0aW9ucy5zcGVlZCwge2Nzczoge2xlZnQ6IHNuYXAubGVmdCArIFwicHhcIn0sIGVhc2U6IFBvd2VyMi5lYXNlSW59KTtcbiAgICAgICAgICAgICAgICBpZiAoJGNvbnRlbnQubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgIFR3ZWVuTGl0ZS50bygkY29udGVudCwgb3B0aW9ucy5zcGVlZCwge2Nzczoge2xlZnQ6IHNuYXAubGVmdCArIFwicHhcIn0sIGVhc2U6IFBvd2VyMi5lYXNlSW59KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICAkcmlnaHQub25Nb3VzZSh7XG4gICAgICAgIFwibW91c2Uuc3RhcnRcIjogZnVuY3Rpb24gKGUsIHBvcykge1xuICAgICAgICAgICAgcG9zLmRhdGEubGVmdCA9ICRyaWdodC5wb3NpdGlvbigpLmxlZnQ7XG4gICAgICAgICAgICBwb3MucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgICB9LFxuICAgICAgICBcIm1vdXNlLm1vdmVcIjogZnVuY3Rpb24gKGUsIHBvcykge1xuICAgICAgICAgICAgdmFyIGRpZmYgPSBwb3MuZGlmZigpO1xuICAgICAgICAgICAgdmFyIGwxID0gYm91bmRSaWdodChwb3MuZGF0YS5sZWZ0ICsgZGlmZi54KTtcbiAgICAgICAgICAgICRyaWdodC5jc3Moe2xlZnQ6IGwxICsgXCJweFwifSk7XG4gICAgICAgICAgICBzZXRWYWx1ZSgkcmlnaHQsIGdldFZhbHVlKGwxKSk7XG4gICAgICAgICAgICBpZiAoJGNvbnRlbnQubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgJGNvbnRlbnQuY3NzKHtyaWdodDogd2lkdGggLSBsMSArIFwicHhcIn0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBcIm1vdXNlLnN0b3BcIjogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIHNuYXAgPSBnZXRTbmFwKCRyaWdodCk7XG4gICAgICAgICAgICBpZiAoc25hcC50aWNrKSB7XG4gICAgICAgICAgICAgICAgc2V0VmFsdWUoJHJpZ2h0LCBnZXRWYWx1ZShzbmFwLmxlZnQpKTtcbiAgICAgICAgICAgICAgICBUd2VlbkxpdGUudG8odGhpcywgb3B0aW9ucy5zcGVlZCwge2Nzczoge2xlZnQ6IHNuYXAubGVmdCArIFwicHhcIn0sIGVhc2U6IFBvd2VyMi5lYXNlSW59KTtcbiAgICAgICAgICAgICAgICBpZiAoJGNvbnRlbnQubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgIFR3ZWVuTGl0ZS50bygkY29udGVudCwgb3B0aW9ucy5zcGVlZCwge1xuICAgICAgICAgICAgICAgICAgICAgICAgY3NzOiB7cmlnaHQ6IHdpZHRoIC0gc25hcC5sZWZ0ICsgXCJweFwifSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGVhc2U6IFBvd2VyMi5lYXNlSW5cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSk7XG5cblxufVxuXG5cbiQuZm4udWlTbGlkZXIgPSBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgIG9wdGlvbnMgPSAkLmV4dGVuZCh7djogMX0sIG9wdGlvbnMpO1xuICAgIG9wdGlvbnMudiA9IDI7XG4gICAgcmV0dXJuIHRoaXMuZWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgIG5ldyBTbGlkZXIodGhpcywgb3B0aW9ucyk7XG4gICAgfSk7XG59OyIsInZhciBwYXJzZURhdGEgPSByZXF1aXJlKFwiLi4vdXRpbHMvcGFyc2VEYXRhXCIpO1xyXG4kLmZuLnVpVGFicyA9IGZ1bmN0aW9uIChvcHRpb25zKSB7XHJcbiAgICByZXR1cm4gdGhpcy5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgb3B0aW9ucyA9ICQuZXh0ZW5kKHtob3ZlcjogZmFsc2UsIHNob3dDb250cm9sbGVyczogZmFsc2V9LCBvcHRpb25zKTtcclxuICAgICAgICB2YXIgZWxtID0gdGhpcztcclxuICAgICAgICBvcHRpb25zLmhvdmVyID0gcGFyc2VEYXRhLmdldEJvb2xlYW4odGhpcywgXCJob3ZlclwiLCBmYWxzZSk7XHJcbiAgICAgICAgb3B0aW9ucy5zaG93Q29udHJvbGxlcnMgPSBwYXJzZURhdGEuZ2V0Qm9vbGVhbih0aGlzLCBcInNob3djb250cm9sbGVyc1wiLCBmYWxzZSk7XHJcblxyXG4gICAgICAgICQoXCIudWktdGFicy1jb250ZW50XCIsIGVsbSkuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGlmICgkKHRoaXMpLmNsb3Nlc3QoXCIudWktdGFic1wiKS5pcygkKGVsbSkpKSB7XHJcbiAgICAgICAgICAgICAgICAkKHRoaXMpLmhpZGUoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIGZ1bmN0aW9uIGFjdGlvbigkaGVhZCkge1xyXG4gICAgICAgICAgICB2YXIgaW5kID0gJGhlYWQucGFyZW50KCkuaW5kZXgoKTtcclxuICAgICAgICAgICAgJGhlYWQuY2xvc2VzdChcIi51aS10YWJzLWhlYWRlclwiKS5maW5kKFwibGlcIikucmVtb3ZlQ2xhc3MoXCJzZWxlY3RlZFwiKS5jaGlsZHJlbigpLnJlbW92ZUNsYXNzKFwic2VsZWN0ZWRcIik7XHJcbiAgICAgICAgICAgICRoZWFkLnBhcmVudCgpLmFkZENsYXNzKFwic2VsZWN0ZWRcIikuY2hpbGRyZW4oKS5hZGRDbGFzcyhcInNlbGVjdGVkXCIpO1xyXG5cclxuICAgICAgICAgICAgdmFyIGNvbnRlbnQgPSAkaGVhZC5jbG9zZXN0KFwiLnVpLXRhYnMtaGVhZGVyXCIpLm5leHQoKS5maW5kKFwiLnVpLXRhYnMtY29udGVudFwiKS5maWx0ZXIoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuICQodGhpcykuY2xvc2VzdChcIi51aS10YWJzXCIpLmlzKCQoZWxtKSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgLy8gdmFyIGNvbnRlbnQgPSAkKFwiPiAudWktdGFicy1ib2R5XCIsICRoZWFkLmNsb3Nlc3QoXCIudWktdGFic1wiKSkuZmluZChcIi51aS10YWJzLWNvbnRlbnRcIikuZmlsdGVyKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgLy8gICAgIHJldHVybiAkKHRoaXMpLmNsb3Nlc3QoXCIudWktdGFic1wiKS5pcygkKGVsbSkpO1xyXG4gICAgICAgICAgICAvLyB9KTtcclxuXHJcbiAgICAgICAgICAgIGNvbnRlbnQuaGlkZSgpO1xyXG4gICAgICAgICAgICBjb250ZW50LmVxKGluZCkuc2hvdygpLnRyaWdnZXIoXCJ0YWIuY29udGVudFZpc2libGVcIik7XHJcbiAgICAgICAgICAgIGNvbnRlbnQuZmluZChcIi5zaG93XCIpLnRyaWdnZXIoXCJzaG93XCIpO1xyXG4gICAgICAgICAgICAkKGVsbSkudHJpZ2dlcihcInRhYi5jaGFuZ2VcIik7XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChvcHRpb25zLnNob3dDb250cm9sbGVycykge1xyXG4gICAgICAgICAgICAkKFwiLnVpLXRhYnMtaGVhZGVyXCIsIGVsbSkuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgdGFicyA9ICQodGhpcykuY2xvc2VzdChcIi51aS10YWJzXCIpO1xyXG4gICAgICAgICAgICAgICAgaWYgKHRhYnMuaXMoJChlbG0pKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBoZWFkZXIgPSAkKHRoaXMpO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBjb250cm9sbGVycyA9ICQoJzxkaXYgY2xhc3M9XCJ1aS10YWJzLWNvbnRyb2xsZXJzXCI+PC9kaXY+Jyk7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGxlZnQgPSAkKCc8ZGl2IGNsYXNzPVwidWktdGFicy1jb250cm9sbGVyIGxlZnRcIj48PC9kaXY+Jyk7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHJpZ2h0ID0gJCgnPGRpdiBjbGFzcz1cInVpLXRhYnMtY29udHJvbGxlciByaWdodFwiPj48L2Rpdj4nKTtcclxuICAgICAgICAgICAgICAgICAgICBjb250cm9sbGVycy5hcHBlbmQobGVmdCk7XHJcbiAgICAgICAgICAgICAgICAgICAgY29udHJvbGxlcnMuYXBwZW5kKHJpZ2h0KTtcclxuICAgICAgICAgICAgICAgICAgICBoZWFkZXIuYXBwZW5kKGNvbnRyb2xsZXJzKTtcclxuICAgICAgICAgICAgICAgICAgICBsZWZ0LmNsaWNrKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGN1ciA9IGhlYWRlci5maW5kKFwibGkuc2VsZWN0ZWRcIikuaW5kZXgoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGN1ciA9PSAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBnb1RvRXEoaGVhZGVyLCBoZWFkZXIuZmluZChcImxpXCIpLmxlbmd0aCAtIDEpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZ29Ub0VxKGhlYWRlciwgY3VyIC0gMSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICByaWdodC5jbGljayhmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBjdXIgPSBoZWFkZXIuZmluZChcImxpLnNlbGVjdGVkXCIpLmluZGV4KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjdXIgPT0gaGVhZGVyLmZpbmQoXCJsaVwiKS5sZW5ndGggLSAxKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBnb1RvRXEoaGVhZGVyLCAwKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdvVG9FcShoZWFkZXIsIGN1ciArIDEpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKG9wdGlvbnMuaG92ZXIpIHtcclxuICAgICAgICAgICAgJChcIi51aS10YWJzLWhlYWRlciBhXCIsIGVsbSkuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgdGFicyA9ICQodGhpcykuY2xvc2VzdChcIi51aS10YWJzXCIpO1xyXG4gICAgICAgICAgICAgICAgaWYgKHRhYnMuaXMoJChlbG0pKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICQodGhpcykubW91c2VlbnRlcihmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBhY3Rpb24oJCh0aGlzKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCF0YWJzLmRhdGEoXCJpbml0ZWRcIikgJiYgJCh0aGlzKS5wYXJlbnQoKS5oYXNDbGFzcyhcInNlbGVjdGVkXCIpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRhYnMuZGF0YShcImluaXRlZFwiLCB0cnVlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJCh0aGlzKS50cmlnZ2VyKFwibW91c2VlbnRlclwiKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgJChcIi51aS10YWJzLWhlYWRlciBhXCIsIGVsbSkuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgdGFicyA9ICQodGhpcykuY2xvc2VzdChcIi51aS10YWJzXCIpO1xyXG4gICAgICAgICAgICAgICAgaWYgKHRhYnMuaXMoJChlbG0pKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICQodGhpcykuY2xpY2soZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gYWN0aW9uKCQodGhpcykpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICghdGFicy5kYXRhKFwiaW5pdGVkXCIpICYmICQodGhpcykucGFyZW50KCkuaGFzQ2xhc3MoXCJzZWxlY3RlZFwiKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0YWJzLmRhdGEoXCJpbml0ZWRcIiwgdHJ1ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICQodGhpcykudHJpZ2dlcihcImNsaWNrXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoISQoZWxtKS5kYXRhKFwiaW5pdGVkXCIpKSB7XHJcbiAgICAgICAgICAgICQoXCIudWktdGFicy1oZWFkZXIgYVwiLCBlbG0pLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIHRhYnMgPSAkKHRoaXMpLmNsb3Nlc3QoXCIudWktdGFic1wiKTtcclxuICAgICAgICAgICAgICAgIGlmICh0YWJzLmlzKCQoZWxtKSkgJiYgIXRhYnMuZGF0YShcImluaXRlZFwiKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRhYnMuZGF0YShcImluaXRlZFwiLCB0cnVlKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAob3B0aW9ucy5ob3Zlcikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAkKHRoaXMpLnRyaWdnZXIoXCJtb3VzZWVudGVyXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICQodGhpcykudHJpZ2dlcihcImNsaWNrXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmdW5jdGlvbiBnb1RvRXEoaGVhZGVyLCBlcSkge1xyXG4gICAgICAgICAgICBoZWFkZXIuZmluZChcImxpXCIpLmVxKGVxKS5maW5kKFwiYVwiKS50cmlnZ2VyKG9wdGlvbnMuaG92ZXIgPyBcIm1vdXNlZW50ZXJcIiA6IFwiY2xpY2tcIik7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn07XHJcblxyXG5cclxuXHJcbiIsInZhciBfID0gcmVxdWlyZShcInVuZGVyc2NvcmVcIik7XG5cbmV4cG9ydHMuZ2V0TnVtYmVyID0gZnVuY3Rpb24gKGVsbSwgcHJvcCwgZGVmKSB7XG4gICAgZGVmID0gZGVmIHx8IDA7XG4gICAgdmFyIHZhbCA9IE51bWJlcigkKGVsbSkuZGF0YShwcm9wKSk7XG4gICAgcmV0dXJuIGlzTmFOKHZhbCkgPyBkZWYgOiB2YWw7XG59O1xuXG5cbmV4cG9ydHMuZ2V0Qm9vbGVhbiA9IGZ1bmN0aW9uIChlbG0sIHByb3AsIGRlZikge1xuICAgIHZhciB2YWwgPSAkKGVsbSkuZGF0YShwcm9wKTtcbiAgICBpZiAoXy5pc1VuZGVmaW5lZCh2YWwpKSB7XG4gICAgICAgIHJldHVybiAhIWRlZjtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG59O1xuXG5leHBvcnRzLmdldFN0cmluZyA9IGZ1bmN0aW9uIChlbG0sIHByb3AsIGRlZikge1xuICAgIGRlZiA9IGRlZiB8fCBcIlwiO1xuICAgIHZhciB2YWwgPSAkKGVsbSkuZGF0YShwcm9wKTtcbiAgICBpZiAoXy5pc1VuZGVmaW5lZCh2YWwpKSB7XG4gICAgICAgIHJldHVybiBkZWY7XG4gICAgfVxuICAgIHJldHVybiB2YWw7XG59O1xuXG5leHBvcnRzLmdldFVybFBhcmFtZXRlciA9IGZ1bmN0aW9uIGdldFVybFBhcmFtZXRlcihzUGFyYW0pIHtcbiAgICB2YXIgc1BhZ2VVUkwgPSBkZWNvZGVVUklDb21wb25lbnQod2luZG93LmxvY2F0aW9uLnNlYXJjaC5zdWJzdHJpbmcoMSkpLFxuICAgICAgICBzVVJMVmFyaWFibGVzID0gc1BhZ2VVUkwuc3BsaXQoJyYnKSxcbiAgICAgICAgc1BhcmFtZXRlck5hbWUsXG4gICAgICAgIGk7XG5cbiAgICBmb3IgKGkgPSAwOyBpIDwgc1VSTFZhcmlhYmxlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBzUGFyYW1ldGVyTmFtZSA9IHNVUkxWYXJpYWJsZXNbaV0uc3BsaXQoJz0nKTtcblxuICAgICAgICBpZiAoc1BhcmFtZXRlck5hbWVbMF0gPT09IHNQYXJhbSkge1xuICAgICAgICAgICAgcmV0dXJuIHNQYXJhbWV0ZXJOYW1lWzFdID09PSB1bmRlZmluZWQgPyB0cnVlIDogc1BhcmFtZXRlck5hbWVbMV07XG4gICAgICAgIH1cbiAgICB9XG59OyIsIi8qISBIYW1tZXIuSlMgLSB2MS4xLjMgLSAyMDE0LTA1LTIyXG4gKiBodHRwOi8vZWlnaHRtZWRpYS5naXRodWIuaW8vaGFtbWVyLmpzXG4gKlxuICogQ29weXJpZ2h0IChjKSAyMDE0IEpvcmlrIFRhbmdlbGRlciA8ai50YW5nZWxkZXJAZ21haWwuY29tPjtcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgbGljZW5zZSAqL1xuXG4oZnVuY3Rpb24od2luZG93LCB1bmRlZmluZWQpIHtcbiAgJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIEBtYWluXG4gKiBAbW9kdWxlIGhhbW1lclxuICpcbiAqIEBjbGFzcyBIYW1tZXJcbiAqIEBzdGF0aWNcbiAqL1xuXG4vKipcbiAqIEhhbW1lciwgdXNlIHRoaXMgdG8gY3JlYXRlIGluc3RhbmNlc1xuICogYGBgYFxuICogdmFyIGhhbW1lcnRpbWUgPSBuZXcgSGFtbWVyKG15RWxlbWVudCk7XG4gKiBgYGBgXG4gKlxuICogQG1ldGhvZCBIYW1tZXJcbiAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGVsZW1lbnRcbiAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9ucz17fV1cbiAqIEByZXR1cm4ge0hhbW1lci5JbnN0YW5jZX1cbiAqL1xudmFyIEhhbW1lciA9IGZ1bmN0aW9uIEhhbW1lcihlbGVtZW50LCBvcHRpb25zKSB7XG4gICAgcmV0dXJuIG5ldyBIYW1tZXIuSW5zdGFuY2UoZWxlbWVudCwgb3B0aW9ucyB8fCB7fSk7XG59O1xuXG4vKipcbiAqIHZlcnNpb24sIGFzIGRlZmluZWQgaW4gcGFja2FnZS5qc29uXG4gKiB0aGUgdmFsdWUgd2lsbCBiZSBzZXQgYXQgZWFjaCBidWlsZFxuICogQHByb3BlcnR5IFZFUlNJT05cbiAqIEBmaW5hbFxuICogQHR5cGUge1N0cmluZ31cbiAqL1xuSGFtbWVyLlZFUlNJT04gPSAnMS4xLjMnO1xuXG4vKipcbiAqIGRlZmF1bHQgc2V0dGluZ3MuXG4gKiBtb3JlIHNldHRpbmdzIGFyZSBkZWZpbmVkIHBlciBnZXN0dXJlIGF0IGAvZ2VzdHVyZXNgLiBFYWNoIGdlc3R1cmUgY2FuIGJlIGRpc2FibGVkL2VuYWJsZWRcbiAqIGJ5IHNldHRpbmcgaXQncyBuYW1lIChsaWtlIGBzd2lwZWApIHRvIGZhbHNlLlxuICogWW91IGNhbiBzZXQgdGhlIGRlZmF1bHRzIGZvciBhbGwgaW5zdGFuY2VzIGJ5IGNoYW5naW5nIHRoaXMgb2JqZWN0IGJlZm9yZSBjcmVhdGluZyBhbiBpbnN0YW5jZS5cbiAqIEBleGFtcGxlXG4gKiBgYGBgXG4gKiAgSGFtbWVyLmRlZmF1bHRzLmRyYWcgPSBmYWxzZTtcbiAqICBIYW1tZXIuZGVmYXVsdHMuYmVoYXZpb3IudG91Y2hBY3Rpb24gPSAncGFuLXknO1xuICogIGRlbGV0ZSBIYW1tZXIuZGVmYXVsdHMuYmVoYXZpb3IudXNlclNlbGVjdDtcbiAqIGBgYGBcbiAqIEBwcm9wZXJ0eSBkZWZhdWx0c1xuICogQHR5cGUge09iamVjdH1cbiAqL1xuSGFtbWVyLmRlZmF1bHRzID0ge1xuICAgIC8qKlxuICAgICAqIHRoaXMgc2V0dGluZyBvYmplY3QgYWRkcyBzdHlsZXMgYW5kIGF0dHJpYnV0ZXMgdG8gdGhlIGVsZW1lbnQgdG8gcHJldmVudCB0aGUgYnJvd3NlciBmcm9tIGRvaW5nXG4gICAgICogaXRzIG5hdGl2ZSBiZWhhdmlvci4gVGhlIGNzcyBwcm9wZXJ0aWVzIGFyZSBhdXRvIHByZWZpeGVkIGZvciB0aGUgYnJvd3NlcnMgd2hlbiBuZWVkZWQuXG4gICAgICogQHByb3BlcnR5IGRlZmF1bHRzLmJlaGF2aW9yXG4gICAgICogQHR5cGUge09iamVjdH1cbiAgICAgKi9cbiAgICBiZWhhdmlvcjoge1xuICAgICAgICAvKipcbiAgICAgICAgICogRGlzYWJsZXMgdGV4dCBzZWxlY3Rpb24gdG8gaW1wcm92ZSB0aGUgZHJhZ2dpbmcgZ2VzdHVyZS4gV2hlbiB0aGUgdmFsdWUgaXMgYG5vbmVgIGl0IGFsc28gc2V0c1xuICAgICAgICAgKiBgb25zZWxlY3RzdGFydD1mYWxzZWAgZm9yIElFIG9uIHRoZSBlbGVtZW50LiBNYWlubHkgZm9yIGRlc2t0b3AgYnJvd3NlcnMuXG4gICAgICAgICAqIEBwcm9wZXJ0eSBkZWZhdWx0cy5iZWhhdmlvci51c2VyU2VsZWN0XG4gICAgICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICAgICAqIEBkZWZhdWx0ICdub25lJ1xuICAgICAgICAgKi9cbiAgICAgICAgdXNlclNlbGVjdDogJ25vbmUnLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBTcGVjaWZpZXMgd2hldGhlciBhbmQgaG93IGEgZ2l2ZW4gcmVnaW9uIGNhbiBiZSBtYW5pcHVsYXRlZCBieSB0aGUgdXNlciAoZm9yIGluc3RhbmNlLCBieSBwYW5uaW5nIG9yIHpvb21pbmcpLlxuICAgICAgICAgKiBVc2VkIGJ5IENocm9tZSAzNT4gYW5kIElFMTA+LiBCeSBkZWZhdWx0IHRoaXMgbWFrZXMgdGhlIGVsZW1lbnQgYmxvY2tpbmcgYW55IHRvdWNoIGV2ZW50LlxuICAgICAgICAgKiBAcHJvcGVydHkgZGVmYXVsdHMuYmVoYXZpb3IudG91Y2hBY3Rpb25cbiAgICAgICAgICogQHR5cGUge1N0cmluZ31cbiAgICAgICAgICogQGRlZmF1bHQ6ICdwYW4teSdcbiAgICAgICAgICovXG4gICAgICAgIHRvdWNoQWN0aW9uOiAncGFuLXknLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBEaXNhYmxlcyB0aGUgZGVmYXVsdCBjYWxsb3V0IHNob3duIHdoZW4geW91IHRvdWNoIGFuZCBob2xkIGEgdG91Y2ggdGFyZ2V0LlxuICAgICAgICAgKiBPbiBpT1MsIHdoZW4geW91IHRvdWNoIGFuZCBob2xkIGEgdG91Y2ggdGFyZ2V0IHN1Y2ggYXMgYSBsaW5rLCBTYWZhcmkgZGlzcGxheXNcbiAgICAgICAgICogYSBjYWxsb3V0IGNvbnRhaW5pbmcgaW5mb3JtYXRpb24gYWJvdXQgdGhlIGxpbmsuIFRoaXMgcHJvcGVydHkgYWxsb3dzIHlvdSB0byBkaXNhYmxlIHRoYXQgY2FsbG91dC5cbiAgICAgICAgICogQHByb3BlcnR5IGRlZmF1bHRzLmJlaGF2aW9yLnRvdWNoQ2FsbG91dFxuICAgICAgICAgKiBAdHlwZSB7U3RyaW5nfVxuICAgICAgICAgKiBAZGVmYXVsdCAnbm9uZSdcbiAgICAgICAgICovXG4gICAgICAgIHRvdWNoQ2FsbG91dDogJ25vbmUnLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBTcGVjaWZpZXMgd2hldGhlciB6b29taW5nIGlzIGVuYWJsZWQuIFVzZWQgYnkgSUUxMD5cbiAgICAgICAgICogQHByb3BlcnR5IGRlZmF1bHRzLmJlaGF2aW9yLmNvbnRlbnRab29taW5nXG4gICAgICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICAgICAqIEBkZWZhdWx0ICdub25lJ1xuICAgICAgICAgKi9cbiAgICAgICAgY29udGVudFpvb21pbmc6ICdub25lJyxcblxuICAgICAgICAvKipcbiAgICAgICAgICogU3BlY2lmaWVzIHRoYXQgYW4gZW50aXJlIGVsZW1lbnQgc2hvdWxkIGJlIGRyYWdnYWJsZSBpbnN0ZWFkIG9mIGl0cyBjb250ZW50cy5cbiAgICAgICAgICogTWFpbmx5IGZvciBkZXNrdG9wIGJyb3dzZXJzLlxuICAgICAgICAgKiBAcHJvcGVydHkgZGVmYXVsdHMuYmVoYXZpb3IudXNlckRyYWdcbiAgICAgICAgICogQHR5cGUge1N0cmluZ31cbiAgICAgICAgICogQGRlZmF1bHQgJ25vbmUnXG4gICAgICAgICAqL1xuICAgICAgICB1c2VyRHJhZzogJ25vbmUnLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBPdmVycmlkZXMgdGhlIGhpZ2hsaWdodCBjb2xvciBzaG93biB3aGVuIHRoZSB1c2VyIHRhcHMgYSBsaW5rIG9yIGEgSmF2YVNjcmlwdFxuICAgICAgICAgKiBjbGlja2FibGUgZWxlbWVudCBpbiBTYWZhcmkgb24gaVBob25lLiBUaGlzIHByb3BlcnR5IG9iZXlzIHRoZSBhbHBoYSB2YWx1ZSwgaWYgc3BlY2lmaWVkLlxuICAgICAgICAgKlxuICAgICAgICAgKiBJZiB5b3UgZG9uJ3Qgc3BlY2lmeSBhbiBhbHBoYSB2YWx1ZSwgU2FmYXJpIG9uIGlQaG9uZSBhcHBsaWVzIGEgZGVmYXVsdCBhbHBoYSB2YWx1ZVxuICAgICAgICAgKiB0byB0aGUgY29sb3IuIFRvIGRpc2FibGUgdGFwIGhpZ2hsaWdodGluZywgc2V0IHRoZSBhbHBoYSB2YWx1ZSB0byAwIChpbnZpc2libGUpLlxuICAgICAgICAgKiBJZiB5b3Ugc2V0IHRoZSBhbHBoYSB2YWx1ZSB0byAxLjAgKG9wYXF1ZSksIHRoZSBlbGVtZW50IGlzIG5vdCB2aXNpYmxlIHdoZW4gdGFwcGVkLlxuICAgICAgICAgKiBAcHJvcGVydHkgZGVmYXVsdHMuYmVoYXZpb3IudGFwSGlnaGxpZ2h0Q29sb3JcbiAgICAgICAgICogQHR5cGUge1N0cmluZ31cbiAgICAgICAgICogQGRlZmF1bHQgJ3JnYmEoMCwwLDAsMCknXG4gICAgICAgICAqL1xuICAgICAgICB0YXBIaWdobGlnaHRDb2xvcjogJ3JnYmEoMCwwLDAsMCknXG4gICAgfVxufTtcblxuLyoqXG4gKiBoYW1tZXIgZG9jdW1lbnQgd2hlcmUgdGhlIGJhc2UgZXZlbnRzIGFyZSBhZGRlZCBhdFxuICogQHByb3BlcnR5IERPQ1VNRU5UXG4gKiBAdHlwZSB7SFRNTEVsZW1lbnR9XG4gKiBAZGVmYXVsdCB3aW5kb3cuZG9jdW1lbnRcbiAqL1xuSGFtbWVyLkRPQ1VNRU5UID0gZG9jdW1lbnQ7XG5cbi8qKlxuICogZGV0ZWN0IHN1cHBvcnQgZm9yIHBvaW50ZXIgZXZlbnRzXG4gKiBAcHJvcGVydHkgSEFTX1BPSU5URVJFVkVOVFNcbiAqIEB0eXBlIHtCb29sZWFufVxuICovXG5IYW1tZXIuSEFTX1BPSU5URVJFVkVOVFMgPSBuYXZpZ2F0b3IucG9pbnRlckVuYWJsZWQgfHwgbmF2aWdhdG9yLm1zUG9pbnRlckVuYWJsZWQ7XG5cbi8qKlxuICogZGV0ZWN0IHN1cHBvcnQgZm9yIHRvdWNoIGV2ZW50c1xuICogQHByb3BlcnR5IEhBU19UT1VDSEVWRU5UU1xuICogQHR5cGUge0Jvb2xlYW59XG4gKi9cbkhhbW1lci5IQVNfVE9VQ0hFVkVOVFMgPSAoJ29udG91Y2hzdGFydCcgaW4gd2luZG93KTtcblxuLyoqXG4gKiBkZXRlY3QgbW9iaWxlIGJyb3dzZXJzXG4gKiBAcHJvcGVydHkgSVNfTU9CSUxFXG4gKiBAdHlwZSB7Qm9vbGVhbn1cbiAqL1xuSGFtbWVyLklTX01PQklMRSA9IC9tb2JpbGV8dGFibGV0fGlwKGFkfGhvbmV8b2QpfGFuZHJvaWR8c2lsay9pLnRlc3QobmF2aWdhdG9yLnVzZXJBZ2VudCk7XG5cbi8qKlxuICogZGV0ZWN0IGlmIHdlIHdhbnQgdG8gc3VwcG9ydCBtb3VzZWV2ZW50cyBhdCBhbGxcbiAqIEBwcm9wZXJ0eSBOT19NT1VTRUVWRU5UU1xuICogQHR5cGUge0Jvb2xlYW59XG4gKi9cbkhhbW1lci5OT19NT1VTRUVWRU5UUyA9IChIYW1tZXIuSEFTX1RPVUNIRVZFTlRTICYmIEhhbW1lci5JU19NT0JJTEUpIHx8IEhhbW1lci5IQVNfUE9JTlRFUkVWRU5UUztcblxuLyoqXG4gKiBpbnRlcnZhbCBpbiB3aGljaCBIYW1tZXIgcmVjYWxjdWxhdGVzIGN1cnJlbnQgdmVsb2NpdHkvZGlyZWN0aW9uL2FuZ2xlIGluIG1zXG4gKiBAcHJvcGVydHkgQ0FMQ1VMQVRFX0lOVEVSVkFMXG4gKiBAdHlwZSB7TnVtYmVyfVxuICogQGRlZmF1bHQgMjVcbiAqL1xuSGFtbWVyLkNBTENVTEFURV9JTlRFUlZBTCA9IDI1O1xuXG4vKipcbiAqIGV2ZW50dHlwZXMgcGVyIHRvdWNoZXZlbnQgKHN0YXJ0LCBtb3ZlLCBlbmQpIGFyZSBmaWxsZWQgYnkgYEV2ZW50LmRldGVybWluZUV2ZW50VHlwZXNgIG9uIGBzZXR1cGBcbiAqIHRoZSBvYmplY3QgY29udGFpbnMgdGhlIERPTSBldmVudCBuYW1lcyBwZXIgdHlwZSAoYEVWRU5UX1NUQVJUYCwgYEVWRU5UX01PVkVgLCBgRVZFTlRfRU5EYClcbiAqIEBwcm9wZXJ0eSBFVkVOVF9UWVBFU1xuICogQHByaXZhdGVcbiAqIEB3cml0ZU9uY2VcbiAqIEB0eXBlIHtPYmplY3R9XG4gKi9cbnZhciBFVkVOVF9UWVBFUyA9IHt9O1xuXG4vKipcbiAqIGRpcmVjdGlvbiBzdHJpbmdzLCBmb3Igc2FmZSBjb21wYXJpc29uc1xuICogQHByb3BlcnR5IERJUkVDVElPTl9ET1dOfExFRlR8VVB8UklHSFRcbiAqIEBmaW5hbFxuICogQHR5cGUge1N0cmluZ31cbiAqIEBkZWZhdWx0ICdkb3duJyAnbGVmdCcgJ3VwJyAncmlnaHQnXG4gKi9cbnZhciBESVJFQ1RJT05fRE9XTiA9IEhhbW1lci5ESVJFQ1RJT05fRE9XTiA9ICdkb3duJztcbnZhciBESVJFQ1RJT05fTEVGVCA9IEhhbW1lci5ESVJFQ1RJT05fTEVGVCA9ICdsZWZ0JztcbnZhciBESVJFQ1RJT05fVVAgPSBIYW1tZXIuRElSRUNUSU9OX1VQID0gJ3VwJztcbnZhciBESVJFQ1RJT05fUklHSFQgPSBIYW1tZXIuRElSRUNUSU9OX1JJR0hUID0gJ3JpZ2h0JztcblxuLyoqXG4gKiBwb2ludGVydHlwZSBzdHJpbmdzLCBmb3Igc2FmZSBjb21wYXJpc29uc1xuICogQHByb3BlcnR5IFBPSU5URVJfTU9VU0V8VE9VQ0h8UEVOXG4gKiBAZmluYWxcbiAqIEB0eXBlIHtTdHJpbmd9XG4gKiBAZGVmYXVsdCAnbW91c2UnICd0b3VjaCcgJ3BlbidcbiAqL1xudmFyIFBPSU5URVJfTU9VU0UgPSBIYW1tZXIuUE9JTlRFUl9NT1VTRSA9ICdtb3VzZSc7XG52YXIgUE9JTlRFUl9UT1VDSCA9IEhhbW1lci5QT0lOVEVSX1RPVUNIID0gJ3RvdWNoJztcbnZhciBQT0lOVEVSX1BFTiA9IEhhbW1lci5QT0lOVEVSX1BFTiA9ICdwZW4nO1xuXG4vKipcbiAqIGV2ZW50dHlwZXNcbiAqIEBwcm9wZXJ0eSBFVkVOVF9TVEFSVHxNT1ZFfEVORHxSRUxFQVNFfFRPVUNIXG4gKiBAZmluYWxcbiAqIEB0eXBlIHtTdHJpbmd9XG4gKiBAZGVmYXVsdCAnc3RhcnQnICdjaGFuZ2UnICdtb3ZlJyAnZW5kJyAncmVsZWFzZScgJ3RvdWNoJ1xuICovXG52YXIgRVZFTlRfU1RBUlQgPSBIYW1tZXIuRVZFTlRfU1RBUlQgPSAnc3RhcnQnO1xudmFyIEVWRU5UX01PVkUgPSBIYW1tZXIuRVZFTlRfTU9WRSA9ICdtb3ZlJztcbnZhciBFVkVOVF9FTkQgPSBIYW1tZXIuRVZFTlRfRU5EID0gJ2VuZCc7XG52YXIgRVZFTlRfUkVMRUFTRSA9IEhhbW1lci5FVkVOVF9SRUxFQVNFID0gJ3JlbGVhc2UnO1xudmFyIEVWRU5UX1RPVUNIID0gSGFtbWVyLkVWRU5UX1RPVUNIID0gJ3RvdWNoJztcblxuLyoqXG4gKiBpZiB0aGUgd2luZG93IGV2ZW50cyBhcmUgc2V0Li4uXG4gKiBAcHJvcGVydHkgUkVBRFlcbiAqIEB3cml0ZU9uY2VcbiAqIEB0eXBlIHtCb29sZWFufVxuICogQGRlZmF1bHQgZmFsc2VcbiAqL1xuSGFtbWVyLlJFQURZID0gZmFsc2U7XG5cbi8qKlxuICogcGx1Z2lucyBuYW1lc3BhY2VcbiAqIEBwcm9wZXJ0eSBwbHVnaW5zXG4gKiBAdHlwZSB7T2JqZWN0fVxuICovXG5IYW1tZXIucGx1Z2lucyA9IEhhbW1lci5wbHVnaW5zIHx8IHt9O1xuXG4vKipcbiAqIGdlc3R1cmVzIG5hbWVzcGFjZVxuICogc2VlIGAvZ2VzdHVyZXNgIGZvciB0aGUgZGVmaW5pdGlvbnNcbiAqIEBwcm9wZXJ0eSBnZXN0dXJlc1xuICogQHR5cGUge09iamVjdH1cbiAqL1xuSGFtbWVyLmdlc3R1cmVzID0gSGFtbWVyLmdlc3R1cmVzIHx8IHt9O1xuXG4vKipcbiAqIHNldHVwIGV2ZW50cyB0byBkZXRlY3QgZ2VzdHVyZXMgb24gdGhlIGRvY3VtZW50XG4gKiB0aGlzIGZ1bmN0aW9uIGlzIGNhbGxlZCB3aGVuIGNyZWF0aW5nIGFuIG5ldyBpbnN0YW5jZVxuICogQHByaXZhdGVcbiAqL1xuZnVuY3Rpb24gc2V0dXAoKSB7XG4gICAgaWYoSGFtbWVyLlJFQURZKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBmaW5kIHdoYXQgZXZlbnR0eXBlcyB3ZSBhZGQgbGlzdGVuZXJzIHRvXG4gICAgRXZlbnQuZGV0ZXJtaW5lRXZlbnRUeXBlcygpO1xuXG4gICAgLy8gUmVnaXN0ZXIgYWxsIGdlc3R1cmVzIGluc2lkZSBIYW1tZXIuZ2VzdHVyZXNcbiAgICBVdGlscy5lYWNoKEhhbW1lci5nZXN0dXJlcywgZnVuY3Rpb24oZ2VzdHVyZSkge1xuICAgICAgICBEZXRlY3Rpb24ucmVnaXN0ZXIoZ2VzdHVyZSk7XG4gICAgfSk7XG5cbiAgICAvLyBBZGQgdG91Y2ggZXZlbnRzIG9uIHRoZSBkb2N1bWVudFxuICAgIEV2ZW50Lm9uVG91Y2goSGFtbWVyLkRPQ1VNRU5ULCBFVkVOVF9NT1ZFLCBEZXRlY3Rpb24uZGV0ZWN0KTtcbiAgICBFdmVudC5vblRvdWNoKEhhbW1lci5ET0NVTUVOVCwgRVZFTlRfRU5ELCBEZXRlY3Rpb24uZGV0ZWN0KTtcblxuICAgIC8vIEhhbW1lciBpcyByZWFkeS4uLiFcbiAgICBIYW1tZXIuUkVBRFkgPSB0cnVlO1xufVxuXG4vKipcbiAqIEBtb2R1bGUgaGFtbWVyXG4gKlxuICogQGNsYXNzIFV0aWxzXG4gKiBAc3RhdGljXG4gKi9cbnZhciBVdGlscyA9IEhhbW1lci51dGlscyA9IHtcbiAgICAvKipcbiAgICAgKiBleHRlbmQgbWV0aG9kLCBjb3VsZCBhbHNvIGJlIHVzZWQgZm9yIGNsb25pbmcgd2hlbiBgZGVzdGAgaXMgYW4gZW1wdHkgb2JqZWN0LlxuICAgICAqIGNoYW5nZXMgdGhlIGRlc3Qgb2JqZWN0XG4gICAgICogQG1ldGhvZCBleHRlbmRcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gZGVzdFxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBzcmNcbiAgICAgKiBAcGFyYW0ge0Jvb2xlYW59IFttZXJnZT1mYWxzZV0gIGRvIGEgbWVyZ2VcbiAgICAgKiBAcmV0dXJuIHtPYmplY3R9IGRlc3RcbiAgICAgKi9cbiAgICBleHRlbmQ6IGZ1bmN0aW9uIGV4dGVuZChkZXN0LCBzcmMsIG1lcmdlKSB7XG4gICAgICAgIGZvcih2YXIga2V5IGluIHNyYykge1xuICAgICAgICAgICAgaWYoIXNyYy5oYXNPd25Qcm9wZXJ0eShrZXkpIHx8IChkZXN0W2tleV0gIT09IHVuZGVmaW5lZCAmJiBtZXJnZSkpIHtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGRlc3Rba2V5XSA9IHNyY1trZXldO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBkZXN0O1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBzaW1wbGUgYWRkRXZlbnRMaXN0ZW5lciB3cmFwcGVyXG4gICAgICogQG1ldGhvZCBvblxuICAgICAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGVsZW1lbnRcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gdHlwZVxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGhhbmRsZXJcbiAgICAgKi9cbiAgICBvbjogZnVuY3Rpb24gb24oZWxlbWVudCwgdHlwZSwgaGFuZGxlcikge1xuICAgICAgICBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIodHlwZSwgaGFuZGxlciwgZmFsc2UpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBzaW1wbGUgcmVtb3ZlRXZlbnRMaXN0ZW5lciB3cmFwcGVyXG4gICAgICogQG1ldGhvZCBvZmZcbiAgICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlbGVtZW50XG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHR5cGVcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBoYW5kbGVyXG4gICAgICovXG4gICAgb2ZmOiBmdW5jdGlvbiBvZmYoZWxlbWVudCwgdHlwZSwgaGFuZGxlcikge1xuICAgICAgICBlbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIodHlwZSwgaGFuZGxlciwgZmFsc2UpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBmb3JFYWNoIG92ZXIgYXJyYXlzIGFuZCBvYmplY3RzXG4gICAgICogQG1ldGhvZCBlYWNoXG4gICAgICogQHBhcmFtIHtPYmplY3R8QXJyYXl9IG9ialxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGl0ZXJhdG9yXG4gICAgICogQHBhcmFtIHthbnl9IGl0ZXJhdG9yLml0ZW1cbiAgICAgKiBAcGFyYW0ge051bWJlcn0gaXRlcmF0b3IuaW5kZXhcbiAgICAgKiBAcGFyYW0ge09iamVjdHxBcnJheX0gaXRlcmF0b3Iub2JqIHRoZSBzb3VyY2Ugb2JqZWN0XG4gICAgICogQHBhcmFtIHtPYmplY3R9IGNvbnRleHQgdmFsdWUgdG8gdXNlIGFzIGB0aGlzYCBpbiB0aGUgaXRlcmF0b3JcbiAgICAgKi9cbiAgICBlYWNoOiBmdW5jdGlvbiBlYWNoKG9iaiwgaXRlcmF0b3IsIGNvbnRleHQpIHtcbiAgICAgICAgdmFyIGksIGxlbjtcblxuICAgICAgICAvLyBuYXRpdmUgZm9yRWFjaCBvbiBhcnJheXNcbiAgICAgICAgaWYoJ2ZvckVhY2gnIGluIG9iaikge1xuICAgICAgICAgICAgb2JqLmZvckVhY2goaXRlcmF0b3IsIGNvbnRleHQpO1xuICAgICAgICAvLyBhcnJheXNcbiAgICAgICAgfSBlbHNlIGlmKG9iai5sZW5ndGggIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgZm9yKGkgPSAwLCBsZW4gPSBvYmoubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICAgICAgICBpZihpdGVyYXRvci5jYWxsKGNvbnRleHQsIG9ialtpXSwgaSwgb2JqKSA9PT0gZmFsc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgLy8gb2JqZWN0c1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZm9yKGkgaW4gb2JqKSB7XG4gICAgICAgICAgICAgICAgaWYob2JqLmhhc093blByb3BlcnR5KGkpICYmXG4gICAgICAgICAgICAgICAgICAgIGl0ZXJhdG9yLmNhbGwoY29udGV4dCwgb2JqW2ldLCBpLCBvYmopID09PSBmYWxzZSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIGZpbmQgaWYgYSBzdHJpbmcgY29udGFpbnMgdGhlIHN0cmluZyB1c2luZyBpbmRleE9mXG4gICAgICogQG1ldGhvZCBpblN0clxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBzcmNcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gZmluZFxuICAgICAqIEByZXR1cm4ge0Jvb2xlYW59IGZvdW5kXG4gICAgICovXG4gICAgaW5TdHI6IGZ1bmN0aW9uIGluU3RyKHNyYywgZmluZCkge1xuICAgICAgICByZXR1cm4gc3JjLmluZGV4T2YoZmluZCkgPiAtMTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogZmluZCBpZiBhIGFycmF5IGNvbnRhaW5zIHRoZSBvYmplY3QgdXNpbmcgaW5kZXhPZiBvciBhIHNpbXBsZSBwb2x5ZmlsbFxuICAgICAqIEBtZXRob2QgaW5BcnJheVxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBzcmNcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gZmluZFxuICAgICAqIEByZXR1cm4ge0Jvb2xlYW58TnVtYmVyfSBmYWxzZSB3aGVuIG5vdCBmb3VuZCwgb3IgdGhlIGluZGV4XG4gICAgICovXG4gICAgaW5BcnJheTogZnVuY3Rpb24gaW5BcnJheShzcmMsIGZpbmQpIHtcbiAgICAgICAgaWYoc3JjLmluZGV4T2YpIHtcbiAgICAgICAgICAgIHZhciBpbmRleCA9IHNyYy5pbmRleE9mKGZpbmQpO1xuICAgICAgICAgICAgcmV0dXJuIChpbmRleCA9PT0gLTEpID8gZmFsc2UgOiBpbmRleDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGZvcih2YXIgaSA9IDAsIGxlbiA9IHNyYy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgICAgICAgICAgICAgIGlmKHNyY1tpXSA9PT0gZmluZCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gaTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogY29udmVydCBhbiBhcnJheS1saWtlIG9iamVjdCAoYGFyZ3VtZW50c2AsIGB0b3VjaGxpc3RgKSB0byBhbiBhcnJheVxuICAgICAqIEBtZXRob2QgdG9BcnJheVxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvYmpcbiAgICAgKiBAcmV0dXJuIHtBcnJheX1cbiAgICAgKi9cbiAgICB0b0FycmF5OiBmdW5jdGlvbiB0b0FycmF5KG9iaikge1xuICAgICAgICByZXR1cm4gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwob2JqLCAwKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogZmluZCBpZiBhIG5vZGUgaXMgaW4gdGhlIGdpdmVuIHBhcmVudFxuICAgICAqIEBtZXRob2QgaGFzUGFyZW50XG4gICAgICogQHBhcmFtIHtIVE1MRWxlbWVudH0gbm9kZVxuICAgICAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IHBhcmVudFxuICAgICAqIEByZXR1cm4ge0Jvb2xlYW59IGZvdW5kXG4gICAgICovXG4gICAgaGFzUGFyZW50OiBmdW5jdGlvbiBoYXNQYXJlbnQobm9kZSwgcGFyZW50KSB7XG4gICAgICAgIHdoaWxlKG5vZGUpIHtcbiAgICAgICAgICAgIGlmKG5vZGUgPT0gcGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBub2RlID0gbm9kZS5wYXJlbnROb2RlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogZ2V0IHRoZSBjZW50ZXIgb2YgYWxsIHRoZSB0b3VjaGVzXG4gICAgICogQG1ldGhvZCBnZXRDZW50ZXJcbiAgICAgKiBAcGFyYW0ge0FycmF5fSB0b3VjaGVzXG4gICAgICogQHJldHVybiB7T2JqZWN0fSBjZW50ZXIgY29udGFpbnMgYHBhZ2VYYCwgYHBhZ2VZYCwgYGNsaWVudFhgIGFuZCBgY2xpZW50WWAgcHJvcGVydGllc1xuICAgICAqL1xuICAgIGdldENlbnRlcjogZnVuY3Rpb24gZ2V0Q2VudGVyKHRvdWNoZXMpIHtcbiAgICAgICAgdmFyIHBhZ2VYID0gW10sXG4gICAgICAgICAgICBwYWdlWSA9IFtdLFxuICAgICAgICAgICAgY2xpZW50WCA9IFtdLFxuICAgICAgICAgICAgY2xpZW50WSA9IFtdLFxuICAgICAgICAgICAgbWluID0gTWF0aC5taW4sXG4gICAgICAgICAgICBtYXggPSBNYXRoLm1heDtcblxuICAgICAgICAvLyBubyBuZWVkIHRvIGxvb3Agd2hlbiBvbmx5IG9uZSB0b3VjaFxuICAgICAgICBpZih0b3VjaGVzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBwYWdlWDogdG91Y2hlc1swXS5wYWdlWCxcbiAgICAgICAgICAgICAgICBwYWdlWTogdG91Y2hlc1swXS5wYWdlWSxcbiAgICAgICAgICAgICAgICBjbGllbnRYOiB0b3VjaGVzWzBdLmNsaWVudFgsXG4gICAgICAgICAgICAgICAgY2xpZW50WTogdG91Y2hlc1swXS5jbGllbnRZXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgVXRpbHMuZWFjaCh0b3VjaGVzLCBmdW5jdGlvbih0b3VjaCkge1xuICAgICAgICAgICAgcGFnZVgucHVzaCh0b3VjaC5wYWdlWCk7XG4gICAgICAgICAgICBwYWdlWS5wdXNoKHRvdWNoLnBhZ2VZKTtcbiAgICAgICAgICAgIGNsaWVudFgucHVzaCh0b3VjaC5jbGllbnRYKTtcbiAgICAgICAgICAgIGNsaWVudFkucHVzaCh0b3VjaC5jbGllbnRZKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHBhZ2VYOiAobWluLmFwcGx5KE1hdGgsIHBhZ2VYKSArIG1heC5hcHBseShNYXRoLCBwYWdlWCkpIC8gMixcbiAgICAgICAgICAgIHBhZ2VZOiAobWluLmFwcGx5KE1hdGgsIHBhZ2VZKSArIG1heC5hcHBseShNYXRoLCBwYWdlWSkpIC8gMixcbiAgICAgICAgICAgIGNsaWVudFg6IChtaW4uYXBwbHkoTWF0aCwgY2xpZW50WCkgKyBtYXguYXBwbHkoTWF0aCwgY2xpZW50WCkpIC8gMixcbiAgICAgICAgICAgIGNsaWVudFk6IChtaW4uYXBwbHkoTWF0aCwgY2xpZW50WSkgKyBtYXguYXBwbHkoTWF0aCwgY2xpZW50WSkpIC8gMlxuICAgICAgICB9O1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBjYWxjdWxhdGUgdGhlIHZlbG9jaXR5IGJldHdlZW4gdHdvIHBvaW50cy4gdW5pdCBpcyBpbiBweCBwZXIgbXMuXG4gICAgICogQG1ldGhvZCBnZXRWZWxvY2l0eVxuICAgICAqIEBwYXJhbSB7TnVtYmVyfSBkZWx0YVRpbWVcbiAgICAgKiBAcGFyYW0ge051bWJlcn0gZGVsdGFYXG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IGRlbHRhWVxuICAgICAqIEByZXR1cm4ge09iamVjdH0gdmVsb2NpdHkgYHhgIGFuZCBgeWBcbiAgICAgKi9cbiAgICBnZXRWZWxvY2l0eTogZnVuY3Rpb24gZ2V0VmVsb2NpdHkoZGVsdGFUaW1lLCBkZWx0YVgsIGRlbHRhWSkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgeDogTWF0aC5hYnMoZGVsdGFYIC8gZGVsdGFUaW1lKSB8fCAwLFxuICAgICAgICAgICAgeTogTWF0aC5hYnMoZGVsdGFZIC8gZGVsdGFUaW1lKSB8fCAwXG4gICAgICAgIH07XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIGNhbGN1bGF0ZSB0aGUgYW5nbGUgYmV0d2VlbiB0d28gY29vcmRpbmF0ZXNcbiAgICAgKiBAbWV0aG9kIGdldEFuZ2xlXG4gICAgICogQHBhcmFtIHtUb3VjaH0gdG91Y2gxXG4gICAgICogQHBhcmFtIHtUb3VjaH0gdG91Y2gyXG4gICAgICogQHJldHVybiB7TnVtYmVyfSBhbmdsZVxuICAgICAqL1xuICAgIGdldEFuZ2xlOiBmdW5jdGlvbiBnZXRBbmdsZSh0b3VjaDEsIHRvdWNoMikge1xuICAgICAgICB2YXIgeCA9IHRvdWNoMi5jbGllbnRYIC0gdG91Y2gxLmNsaWVudFgsXG4gICAgICAgICAgICB5ID0gdG91Y2gyLmNsaWVudFkgLSB0b3VjaDEuY2xpZW50WTtcblxuICAgICAgICByZXR1cm4gTWF0aC5hdGFuMih5LCB4KSAqIDE4MCAvIE1hdGguUEk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIGRvIGEgc21hbGwgY29tcGFyaXNpb24gdG8gZ2V0IHRoZSBkaXJlY3Rpb24gYmV0d2VlbiB0d28gdG91Y2hlcy5cbiAgICAgKiBAbWV0aG9kIGdldERpcmVjdGlvblxuICAgICAqIEBwYXJhbSB7VG91Y2h9IHRvdWNoMVxuICAgICAqIEBwYXJhbSB7VG91Y2h9IHRvdWNoMlxuICAgICAqIEByZXR1cm4ge1N0cmluZ30gZGlyZWN0aW9uIG1hdGNoZXMgYERJUkVDVElPTl9MRUZUfFJJR0hUfFVQfERPV05gXG4gICAgICovXG4gICAgZ2V0RGlyZWN0aW9uOiBmdW5jdGlvbiBnZXREaXJlY3Rpb24odG91Y2gxLCB0b3VjaDIpIHtcbiAgICAgICAgdmFyIHggPSBNYXRoLmFicyh0b3VjaDEuY2xpZW50WCAtIHRvdWNoMi5jbGllbnRYKSxcbiAgICAgICAgICAgIHkgPSBNYXRoLmFicyh0b3VjaDEuY2xpZW50WSAtIHRvdWNoMi5jbGllbnRZKTtcblxuICAgICAgICBpZih4ID49IHkpIHtcbiAgICAgICAgICAgIHJldHVybiB0b3VjaDEuY2xpZW50WCAtIHRvdWNoMi5jbGllbnRYID4gMCA/IERJUkVDVElPTl9MRUZUIDogRElSRUNUSU9OX1JJR0hUO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0b3VjaDEuY2xpZW50WSAtIHRvdWNoMi5jbGllbnRZID4gMCA/IERJUkVDVElPTl9VUCA6IERJUkVDVElPTl9ET1dOO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBjYWxjdWxhdGUgdGhlIGRpc3RhbmNlIGJldHdlZW4gdHdvIHRvdWNoZXNcbiAgICAgKiBAbWV0aG9kIGdldERpc3RhbmNlXG4gICAgICogQHBhcmFtIHtUb3VjaH10b3VjaDFcbiAgICAgKiBAcGFyYW0ge1RvdWNofSB0b3VjaDJcbiAgICAgKiBAcmV0dXJuIHtOdW1iZXJ9IGRpc3RhbmNlXG4gICAgICovXG4gICAgZ2V0RGlzdGFuY2U6IGZ1bmN0aW9uIGdldERpc3RhbmNlKHRvdWNoMSwgdG91Y2gyKSB7XG4gICAgICAgIHZhciB4ID0gdG91Y2gyLmNsaWVudFggLSB0b3VjaDEuY2xpZW50WCxcbiAgICAgICAgICAgIHkgPSB0b3VjaDIuY2xpZW50WSAtIHRvdWNoMS5jbGllbnRZO1xuXG4gICAgICAgIHJldHVybiBNYXRoLnNxcnQoKHggKiB4KSArICh5ICogeSkpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBjYWxjdWxhdGUgdGhlIHNjYWxlIGZhY3RvciBiZXR3ZWVuIHR3byB0b3VjaExpc3RzXG4gICAgICogbm8gc2NhbGUgaXMgMSwgYW5kIGdvZXMgZG93biB0byAwIHdoZW4gcGluY2hlZCB0b2dldGhlciwgYW5kIGJpZ2dlciB3aGVuIHBpbmNoZWQgb3V0XG4gICAgICogQG1ldGhvZCBnZXRTY2FsZVxuICAgICAqIEBwYXJhbSB7QXJyYXl9IHN0YXJ0IGFycmF5IG9mIHRvdWNoZXNcbiAgICAgKiBAcGFyYW0ge0FycmF5fSBlbmQgYXJyYXkgb2YgdG91Y2hlc1xuICAgICAqIEByZXR1cm4ge051bWJlcn0gc2NhbGVcbiAgICAgKi9cbiAgICBnZXRTY2FsZTogZnVuY3Rpb24gZ2V0U2NhbGUoc3RhcnQsIGVuZCkge1xuICAgICAgICAvLyBuZWVkIHR3byBmaW5nZXJzLi4uXG4gICAgICAgIGlmKHN0YXJ0Lmxlbmd0aCA+PSAyICYmIGVuZC5sZW5ndGggPj0gMikge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ2V0RGlzdGFuY2UoZW5kWzBdLCBlbmRbMV0pIC8gdGhpcy5nZXREaXN0YW5jZShzdGFydFswXSwgc3RhcnRbMV0pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAxO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBjYWxjdWxhdGUgdGhlIHJvdGF0aW9uIGRlZ3JlZXMgYmV0d2VlbiB0d28gdG91Y2hMaXN0c1xuICAgICAqIEBtZXRob2QgZ2V0Um90YXRpb25cbiAgICAgKiBAcGFyYW0ge0FycmF5fSBzdGFydCBhcnJheSBvZiB0b3VjaGVzXG4gICAgICogQHBhcmFtIHtBcnJheX0gZW5kIGFycmF5IG9mIHRvdWNoZXNcbiAgICAgKiBAcmV0dXJuIHtOdW1iZXJ9IHJvdGF0aW9uXG4gICAgICovXG4gICAgZ2V0Um90YXRpb246IGZ1bmN0aW9uIGdldFJvdGF0aW9uKHN0YXJ0LCBlbmQpIHtcbiAgICAgICAgLy8gbmVlZCB0d28gZmluZ2Vyc1xuICAgICAgICBpZihzdGFydC5sZW5ndGggPj0gMiAmJiBlbmQubGVuZ3RoID49IDIpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmdldEFuZ2xlKGVuZFsxXSwgZW5kWzBdKSAtIHRoaXMuZ2V0QW5nbGUoc3RhcnRbMV0sIHN0YXJ0WzBdKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gMDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogZmluZCBvdXQgaWYgdGhlIGRpcmVjdGlvbiBpcyB2ZXJ0aWNhbCAgICpcbiAgICAgKiBAbWV0aG9kIGlzVmVydGljYWxcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gZGlyZWN0aW9uIG1hdGNoZXMgYERJUkVDVElPTl9VUHxET1dOYFxuICAgICAqIEByZXR1cm4ge0Jvb2xlYW59IGlzX3ZlcnRpY2FsXG4gICAgICovXG4gICAgaXNWZXJ0aWNhbDogZnVuY3Rpb24gaXNWZXJ0aWNhbChkaXJlY3Rpb24pIHtcbiAgICAgICAgcmV0dXJuIGRpcmVjdGlvbiA9PSBESVJFQ1RJT05fVVAgfHwgZGlyZWN0aW9uID09IERJUkVDVElPTl9ET1dOO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBzZXQgY3NzIHByb3BlcnRpZXMgd2l0aCB0aGVpciBwcmVmaXhlc1xuICAgICAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGVsZW1lbnRcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gcHJvcFxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSB2YWx1ZVxuICAgICAqIEBwYXJhbSB7Qm9vbGVhbn0gW3RvZ2dsZT10cnVlXVxuICAgICAqIEByZXR1cm4ge0Jvb2xlYW59XG4gICAgICovXG4gICAgc2V0UHJlZml4ZWRDc3M6IGZ1bmN0aW9uIHNldFByZWZpeGVkQ3NzKGVsZW1lbnQsIHByb3AsIHZhbHVlLCB0b2dnbGUpIHtcbiAgICAgICAgdmFyIHByZWZpeGVzID0gWycnLCAnV2Via2l0JywgJ01veicsICdPJywgJ21zJ107XG4gICAgICAgIHByb3AgPSBVdGlscy50b0NhbWVsQ2FzZShwcm9wKTtcblxuICAgICAgICBmb3IodmFyIGkgPSAwOyBpIDwgcHJlZml4ZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBwID0gcHJvcDtcbiAgICAgICAgICAgIC8vIHByZWZpeGVzXG4gICAgICAgICAgICBpZihwcmVmaXhlc1tpXSkge1xuICAgICAgICAgICAgICAgIHAgPSBwcmVmaXhlc1tpXSArIHAuc2xpY2UoMCwgMSkudG9VcHBlckNhc2UoKSArIHAuc2xpY2UoMSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIHRlc3QgdGhlIHN0eWxlXG4gICAgICAgICAgICBpZihwIGluIGVsZW1lbnQuc3R5bGUpIHtcbiAgICAgICAgICAgICAgICBlbGVtZW50LnN0eWxlW3BdID0gKHRvZ2dsZSA9PSBudWxsIHx8IHRvZ2dsZSkgJiYgdmFsdWUgfHwgJyc7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogdG9nZ2xlIGJyb3dzZXIgZGVmYXVsdCBiZWhhdmlvciBieSBzZXR0aW5nIGNzcyBwcm9wZXJ0aWVzLlxuICAgICAqIGB1c2VyU2VsZWN0PSdub25lJ2AgYWxzbyBzZXRzIGBlbGVtZW50Lm9uc2VsZWN0c3RhcnRgIHRvIGZhbHNlXG4gICAgICogYHVzZXJEcmFnPSdub25lJ2AgYWxzbyBzZXRzIGBlbGVtZW50Lm9uZHJhZ3N0YXJ0YCB0byBmYWxzZVxuICAgICAqXG4gICAgICogQG1ldGhvZCB0b2dnbGVCZWhhdmlvclxuICAgICAqIEBwYXJhbSB7SHRtbEVsZW1lbnR9IGVsZW1lbnRcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gcHJvcHNcbiAgICAgKiBAcGFyYW0ge0Jvb2xlYW59IFt0b2dnbGU9dHJ1ZV1cbiAgICAgKi9cbiAgICB0b2dnbGVCZWhhdmlvcjogZnVuY3Rpb24gdG9nZ2xlQmVoYXZpb3IoZWxlbWVudCwgcHJvcHMsIHRvZ2dsZSkge1xuICAgICAgICBpZighcHJvcHMgfHwgIWVsZW1lbnQgfHwgIWVsZW1lbnQuc3R5bGUpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHNldCB0aGUgY3NzIHByb3BlcnRpZXNcbiAgICAgICAgVXRpbHMuZWFjaChwcm9wcywgZnVuY3Rpb24odmFsdWUsIHByb3ApIHtcbiAgICAgICAgICAgIFV0aWxzLnNldFByZWZpeGVkQ3NzKGVsZW1lbnQsIHByb3AsIHZhbHVlLCB0b2dnbGUpO1xuICAgICAgICB9KTtcblxuICAgICAgICB2YXIgZmFsc2VGbiA9IHRvZ2dsZSAmJiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBhbHNvIHRoZSBkaXNhYmxlIG9uc2VsZWN0c3RhcnRcbiAgICAgICAgaWYocHJvcHMudXNlclNlbGVjdCA9PSAnbm9uZScpIHtcbiAgICAgICAgICAgIGVsZW1lbnQub25zZWxlY3RzdGFydCA9IGZhbHNlRm47XG4gICAgICAgIH1cbiAgICAgICAgLy8gYW5kIGRpc2FibGUgb25kcmFnc3RhcnRcbiAgICAgICAgaWYocHJvcHMudXNlckRyYWcgPT0gJ25vbmUnKSB7XG4gICAgICAgICAgICBlbGVtZW50Lm9uZHJhZ3N0YXJ0ID0gZmFsc2VGbjtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBjb252ZXJ0IGEgc3RyaW5nIHdpdGggdW5kZXJzY29yZXMgdG8gY2FtZWxDYXNlXG4gICAgICogc28gcHJldmVudF9kZWZhdWx0IGJlY29tZXMgcHJldmVudERlZmF1bHRcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gc3RyXG4gICAgICogQHJldHVybiB7U3RyaW5nfSBjYW1lbENhc2VTdHJcbiAgICAgKi9cbiAgICB0b0NhbWVsQ2FzZTogZnVuY3Rpb24gdG9DYW1lbENhc2Uoc3RyKSB7XG4gICAgICAgIHJldHVybiBzdHIucmVwbGFjZSgvW18tXShbYS16XSkvZywgZnVuY3Rpb24ocykge1xuICAgICAgICAgICAgcmV0dXJuIHNbMV0udG9VcHBlckNhc2UoKTtcbiAgICAgICAgfSk7XG4gICAgfVxufTtcblxuXG4vKipcbiAqIEBtb2R1bGUgaGFtbWVyXG4gKi9cbi8qKlxuICogQGNsYXNzIEV2ZW50XG4gKiBAc3RhdGljXG4gKi9cbnZhciBFdmVudCA9IEhhbW1lci5ldmVudCA9IHtcbiAgICAvKipcbiAgICAgKiB3aGVuIHRvdWNoIGV2ZW50cyBoYXZlIGJlZW4gZmlyZWQsIHRoaXMgaXMgdHJ1ZVxuICAgICAqIHRoaXMgaXMgdXNlZCB0byBzdG9wIG1vdXNlIGV2ZW50c1xuICAgICAqIEBwcm9wZXJ0eSBwcmV2ZW50X21vdXNlZXZlbnRzXG4gICAgICogQHByaXZhdGVcbiAgICAgKiBAdHlwZSB7Qm9vbGVhbn1cbiAgICAgKi9cbiAgICBwcmV2ZW50TW91c2VFdmVudHM6IGZhbHNlLFxuXG4gICAgLyoqXG4gICAgICogaWYgRVZFTlRfU1RBUlQgaGFzIGJlZW4gZmlyZWRcbiAgICAgKiBAcHJvcGVydHkgc3RhcnRlZFxuICAgICAqIEBwcml2YXRlXG4gICAgICogQHR5cGUge0Jvb2xlYW59XG4gICAgICovXG4gICAgc3RhcnRlZDogZmFsc2UsXG5cbiAgICAvKipcbiAgICAgKiB3aGVuIHRoZSBtb3VzZSBpcyBob2xkIGRvd24sIHRoaXMgaXMgdHJ1ZVxuICAgICAqIEBwcm9wZXJ0eSBzaG91bGRfZGV0ZWN0XG4gICAgICogQHByaXZhdGVcbiAgICAgKiBAdHlwZSB7Qm9vbGVhbn1cbiAgICAgKi9cbiAgICBzaG91bGREZXRlY3Q6IGZhbHNlLFxuXG4gICAgLyoqXG4gICAgICogc2ltcGxlIGV2ZW50IGJpbmRlciB3aXRoIGEgaG9vayBhbmQgc3VwcG9ydCBmb3IgbXVsdGlwbGUgdHlwZXNcbiAgICAgKiBAbWV0aG9kIG9uXG4gICAgICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZWxlbWVudFxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSB0eXBlXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gaGFuZGxlclxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IFtob29rXVxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBob29rLnR5cGVcbiAgICAgKi9cbiAgICBvbjogZnVuY3Rpb24gb24oZWxlbWVudCwgdHlwZSwgaGFuZGxlciwgaG9vaykge1xuICAgICAgICB2YXIgdHlwZXMgPSB0eXBlLnNwbGl0KCcgJyk7XG4gICAgICAgIFV0aWxzLmVhY2godHlwZXMsIGZ1bmN0aW9uKHR5cGUpIHtcbiAgICAgICAgICAgIFV0aWxzLm9uKGVsZW1lbnQsIHR5cGUsIGhhbmRsZXIpO1xuICAgICAgICAgICAgaG9vayAmJiBob29rKHR5cGUpO1xuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogc2ltcGxlIGV2ZW50IHVuYmluZGVyIHdpdGggYSBob29rIGFuZCBzdXBwb3J0IGZvciBtdWx0aXBsZSB0eXBlc1xuICAgICAqIEBtZXRob2Qgb2ZmXG4gICAgICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZWxlbWVudFxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSB0eXBlXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gaGFuZGxlclxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IFtob29rXVxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBob29rLnR5cGVcbiAgICAgKi9cbiAgICBvZmY6IGZ1bmN0aW9uIG9mZihlbGVtZW50LCB0eXBlLCBoYW5kbGVyLCBob29rKSB7XG4gICAgICAgIHZhciB0eXBlcyA9IHR5cGUuc3BsaXQoJyAnKTtcbiAgICAgICAgVXRpbHMuZWFjaCh0eXBlcywgZnVuY3Rpb24odHlwZSkge1xuICAgICAgICAgICAgVXRpbHMub2ZmKGVsZW1lbnQsIHR5cGUsIGhhbmRsZXIpO1xuICAgICAgICAgICAgaG9vayAmJiBob29rKHR5cGUpO1xuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogdGhlIGNvcmUgdG91Y2ggZXZlbnQgaGFuZGxlci5cbiAgICAgKiB0aGlzIGZpbmRzIG91dCBpZiB3ZSBzaG91bGQgdG8gZGV0ZWN0IGdlc3R1cmVzXG4gICAgICogQG1ldGhvZCBvblRvdWNoXG4gICAgICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZWxlbWVudFxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBldmVudFR5cGUgbWF0Y2hlcyBgRVZFTlRfU1RBUlR8TU9WRXxFTkRgXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gaGFuZGxlclxuICAgICAqIEByZXR1cm4gb25Ub3VjaEhhbmRsZXIge0Z1bmN0aW9ufSB0aGUgY29yZSBldmVudCBoYW5kbGVyXG4gICAgICovXG4gICAgb25Ub3VjaDogZnVuY3Rpb24gb25Ub3VjaChlbGVtZW50LCBldmVudFR5cGUsIGhhbmRsZXIpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgICAgIHZhciBvblRvdWNoSGFuZGxlciA9IGZ1bmN0aW9uIG9uVG91Y2hIYW5kbGVyKGV2KSB7XG4gICAgICAgICAgICB2YXIgc3JjVHlwZSA9IGV2LnR5cGUudG9Mb3dlckNhc2UoKSxcbiAgICAgICAgICAgICAgICBpc1BvaW50ZXIgPSBIYW1tZXIuSEFTX1BPSU5URVJFVkVOVFMsXG4gICAgICAgICAgICAgICAgaXNNb3VzZSA9IFV0aWxzLmluU3RyKHNyY1R5cGUsICdtb3VzZScpLFxuICAgICAgICAgICAgICAgIHRyaWdnZXJUeXBlO1xuXG4gICAgICAgICAgICAvLyBpZiB3ZSBhcmUgaW4gYSBtb3VzZWV2ZW50LCBidXQgdGhlcmUgaGFzIGJlZW4gYSB0b3VjaGV2ZW50IHRyaWdnZXJlZCBpbiB0aGlzIHNlc3Npb25cbiAgICAgICAgICAgIC8vIHdlIHdhbnQgdG8gZG8gbm90aGluZy4gc2ltcGx5IGJyZWFrIG91dCBvZiB0aGUgZXZlbnQuXG4gICAgICAgICAgICBpZihpc01vdXNlICYmIHNlbGYucHJldmVudE1vdXNlRXZlbnRzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuXG4gICAgICAgICAgICAvLyBtb3VzZWJ1dHRvbiBtdXN0IGJlIGRvd25cbiAgICAgICAgICAgIH0gZWxzZSBpZihpc01vdXNlICYmIGV2ZW50VHlwZSA9PSBFVkVOVF9TVEFSVCAmJiBldi5idXR0b24gPT09IDApIHtcbiAgICAgICAgICAgICAgICBzZWxmLnByZXZlbnRNb3VzZUV2ZW50cyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIHNlbGYuc2hvdWxkRGV0ZWN0ID0gdHJ1ZTtcbiAgICAgICAgICAgIH0gZWxzZSBpZihpc1BvaW50ZXIgJiYgZXZlbnRUeXBlID09IEVWRU5UX1NUQVJUKSB7XG4gICAgICAgICAgICAgICAgc2VsZi5zaG91bGREZXRlY3QgPSAoZXYuYnV0dG9ucyA9PT0gMSB8fCBQb2ludGVyRXZlbnQubWF0Y2hUeXBlKFBPSU5URVJfVE9VQ0gsIGV2KSk7XG4gICAgICAgICAgICAvLyBqdXN0IGEgdmFsaWQgc3RhcnQgZXZlbnQsIGJ1dCBubyBtb3VzZVxuICAgICAgICAgICAgfSBlbHNlIGlmKCFpc01vdXNlICYmIGV2ZW50VHlwZSA9PSBFVkVOVF9TVEFSVCkge1xuICAgICAgICAgICAgICAgIHNlbGYucHJldmVudE1vdXNlRXZlbnRzID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBzZWxmLnNob3VsZERldGVjdCA9IHRydWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIHVwZGF0ZSB0aGUgcG9pbnRlciBldmVudCBiZWZvcmUgZW50ZXJpbmcgdGhlIGRldGVjdGlvblxuICAgICAgICAgICAgaWYoaXNQb2ludGVyICYmIGV2ZW50VHlwZSAhPSBFVkVOVF9FTkQpIHtcbiAgICAgICAgICAgICAgICBQb2ludGVyRXZlbnQudXBkYXRlUG9pbnRlcihldmVudFR5cGUsIGV2KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gd2UgYXJlIGluIGEgdG91Y2gvZG93biBzdGF0ZSwgc28gYWxsb3dlZCBkZXRlY3Rpb24gb2YgZ2VzdHVyZXNcbiAgICAgICAgICAgIGlmKHNlbGYuc2hvdWxkRGV0ZWN0KSB7XG4gICAgICAgICAgICAgICAgdHJpZ2dlclR5cGUgPSBzZWxmLmRvRGV0ZWN0LmNhbGwoc2VsZiwgZXYsIGV2ZW50VHlwZSwgZWxlbWVudCwgaGFuZGxlcik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIC4uLmFuZCB3ZSBhcmUgZG9uZSB3aXRoIHRoZSBkZXRlY3Rpb25cbiAgICAgICAgICAgIC8vIHNvIHJlc2V0IGV2ZXJ5dGhpbmcgdG8gc3RhcnQgZWFjaCBkZXRlY3Rpb24gdG90YWxseSBmcmVzaFxuICAgICAgICAgICAgaWYodHJpZ2dlclR5cGUgPT0gRVZFTlRfRU5EKSB7XG4gICAgICAgICAgICAgICAgc2VsZi5wcmV2ZW50TW91c2VFdmVudHMgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICBzZWxmLnNob3VsZERldGVjdCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIFBvaW50ZXJFdmVudC5yZXNldCgpO1xuICAgICAgICAgICAgLy8gdXBkYXRlIHRoZSBwb2ludGVyZXZlbnQgb2JqZWN0IGFmdGVyIHRoZSBkZXRlY3Rpb25cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYoaXNQb2ludGVyICYmIGV2ZW50VHlwZSA9PSBFVkVOVF9FTkQpIHtcbiAgICAgICAgICAgICAgICBQb2ludGVyRXZlbnQudXBkYXRlUG9pbnRlcihldmVudFR5cGUsIGV2KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLm9uKGVsZW1lbnQsIEVWRU5UX1RZUEVTW2V2ZW50VHlwZV0sIG9uVG91Y2hIYW5kbGVyKTtcbiAgICAgICAgcmV0dXJuIG9uVG91Y2hIYW5kbGVyO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiB0aGUgY29yZSBkZXRlY3Rpb24gbWV0aG9kXG4gICAgICogdGhpcyBmaW5kcyBvdXQgd2hhdCBoYW1tZXItdG91Y2gtZXZlbnRzIHRvIHRyaWdnZXJcbiAgICAgKiBAbWV0aG9kIGRvRGV0ZWN0XG4gICAgICogQHBhcmFtIHtPYmplY3R9IGV2XG4gICAgICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50VHlwZSBtYXRjaGVzIGBFVkVOVF9TVEFSVHxNT1ZFfEVORGBcbiAgICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlbGVtZW50XG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gaGFuZGxlclxuICAgICAqIEByZXR1cm4ge1N0cmluZ30gdHJpZ2dlclR5cGUgbWF0Y2hlcyBgRVZFTlRfU1RBUlR8TU9WRXxFTkRgXG4gICAgICovXG4gICAgZG9EZXRlY3Q6IGZ1bmN0aW9uIGRvRGV0ZWN0KGV2LCBldmVudFR5cGUsIGVsZW1lbnQsIGhhbmRsZXIpIHtcbiAgICAgICAgdmFyIHRvdWNoTGlzdCA9IHRoaXMuZ2V0VG91Y2hMaXN0KGV2LCBldmVudFR5cGUpO1xuICAgICAgICB2YXIgdG91Y2hMaXN0TGVuZ3RoID0gdG91Y2hMaXN0Lmxlbmd0aDtcbiAgICAgICAgdmFyIHRyaWdnZXJUeXBlID0gZXZlbnRUeXBlO1xuICAgICAgICB2YXIgdHJpZ2dlckNoYW5nZSA9IHRvdWNoTGlzdC50cmlnZ2VyOyAvLyB1c2VkIGJ5IGZha2VNdWx0aXRvdWNoIHBsdWdpblxuICAgICAgICB2YXIgY2hhbmdlZExlbmd0aCA9IHRvdWNoTGlzdExlbmd0aDtcblxuICAgICAgICAvLyBhdCBlYWNoIHRvdWNoc3RhcnQtbGlrZSBldmVudCB3ZSB3YW50IGFsc28gd2FudCB0byB0cmlnZ2VyIGEgVE9VQ0ggZXZlbnQuLi5cbiAgICAgICAgaWYoZXZlbnRUeXBlID09IEVWRU5UX1NUQVJUKSB7XG4gICAgICAgICAgICB0cmlnZ2VyQ2hhbmdlID0gRVZFTlRfVE9VQ0g7XG4gICAgICAgIC8vIC4uLnRoZSBzYW1lIGZvciBhIHRvdWNoZW5kLWxpa2UgZXZlbnRcbiAgICAgICAgfSBlbHNlIGlmKGV2ZW50VHlwZSA9PSBFVkVOVF9FTkQpIHtcbiAgICAgICAgICAgIHRyaWdnZXJDaGFuZ2UgPSBFVkVOVF9SRUxFQVNFO1xuXG4gICAgICAgICAgICAvLyBrZWVwIHRyYWNrIG9mIGhvdyBtYW55IHRvdWNoZXMgaGF2ZSBiZWVuIHJlbW92ZWRcbiAgICAgICAgICAgIGNoYW5nZWRMZW5ndGggPSB0b3VjaExpc3QubGVuZ3RoIC0gKChldi5jaGFuZ2VkVG91Y2hlcykgPyBldi5jaGFuZ2VkVG91Y2hlcy5sZW5ndGggOiAxKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGFmdGVyIHRoZXJlIGFyZSBzdGlsbCB0b3VjaGVzIG9uIHRoZSBzY3JlZW4sXG4gICAgICAgIC8vIHdlIGp1c3Qgd2FudCB0byB0cmlnZ2VyIGEgTU9WRSBldmVudC4gc28gY2hhbmdlIHRoZSBTVEFSVCBvciBFTkQgdG8gYSBNT1ZFXG4gICAgICAgIC8vIGJ1dCBvbmx5IGFmdGVyIGRldGVjdGlvbiBoYXMgYmVlbiBzdGFydGVkLCB0aGUgZmlyc3QgdGltZSB3ZSBhY3R1YWx5IHdhbnQgYSBTVEFSVFxuICAgICAgICBpZihjaGFuZ2VkTGVuZ3RoID4gMCAmJiB0aGlzLnN0YXJ0ZWQpIHtcbiAgICAgICAgICAgIHRyaWdnZXJUeXBlID0gRVZFTlRfTU9WRTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGRldGVjdGlvbiBoYXMgYmVlbiBzdGFydGVkLCB3ZSBrZWVwIHRyYWNrIG9mIHRoaXMsIHNlZSBhYm92ZVxuICAgICAgICB0aGlzLnN0YXJ0ZWQgPSB0cnVlO1xuXG4gICAgICAgIC8vIGdlbmVyYXRlIHNvbWUgZXZlbnQgZGF0YSwgc29tZSBiYXNpYyBpbmZvcm1hdGlvblxuICAgICAgICB2YXIgZXZEYXRhID0gdGhpcy5jb2xsZWN0RXZlbnREYXRhKGVsZW1lbnQsIHRyaWdnZXJUeXBlLCB0b3VjaExpc3QsIGV2KTtcblxuICAgICAgICAvLyB0cmlnZ2VyIHRoZSB0cmlnZ2VyVHlwZSBldmVudCBiZWZvcmUgdGhlIGNoYW5nZSAoVE9VQ0gsIFJFTEVBU0UpIGV2ZW50c1xuICAgICAgICAvLyBidXQgdGhlIEVORCBldmVudCBzaG91bGQgYmUgYXQgbGFzdFxuICAgICAgICBpZihldmVudFR5cGUgIT0gRVZFTlRfRU5EKSB7XG4gICAgICAgICAgICBoYW5kbGVyLmNhbGwoRGV0ZWN0aW9uLCBldkRhdGEpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gdHJpZ2dlciBhIGNoYW5nZSAoVE9VQ0gsIFJFTEVBU0UpIGV2ZW50LCB0aGlzIG1lYW5zIHRoZSBsZW5ndGggb2YgdGhlIHRvdWNoZXMgY2hhbmdlZFxuICAgICAgICBpZih0cmlnZ2VyQ2hhbmdlKSB7XG4gICAgICAgICAgICBldkRhdGEuY2hhbmdlZExlbmd0aCA9IGNoYW5nZWRMZW5ndGg7XG4gICAgICAgICAgICBldkRhdGEuZXZlbnRUeXBlID0gdHJpZ2dlckNoYW5nZTtcblxuICAgICAgICAgICAgaGFuZGxlci5jYWxsKERldGVjdGlvbiwgZXZEYXRhKTtcblxuICAgICAgICAgICAgZXZEYXRhLmV2ZW50VHlwZSA9IHRyaWdnZXJUeXBlO1xuICAgICAgICAgICAgZGVsZXRlIGV2RGF0YS5jaGFuZ2VkTGVuZ3RoO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gdHJpZ2dlciB0aGUgRU5EIGV2ZW50XG4gICAgICAgIGlmKHRyaWdnZXJUeXBlID09IEVWRU5UX0VORCkge1xuICAgICAgICAgICAgaGFuZGxlci5jYWxsKERldGVjdGlvbiwgZXZEYXRhKTtcblxuICAgICAgICAgICAgLy8gLi4uYW5kIHdlIGFyZSBkb25lIHdpdGggdGhlIGRldGVjdGlvblxuICAgICAgICAgICAgLy8gc28gcmVzZXQgZXZlcnl0aGluZyB0byBzdGFydCBlYWNoIGRldGVjdGlvbiB0b3RhbGx5IGZyZXNoXG4gICAgICAgICAgICB0aGlzLnN0YXJ0ZWQgPSBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0cmlnZ2VyVHlwZTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogd2UgaGF2ZSBkaWZmZXJlbnQgZXZlbnRzIGZvciBlYWNoIGRldmljZS9icm93c2VyXG4gICAgICogZGV0ZXJtaW5lIHdoYXQgd2UgbmVlZCBhbmQgc2V0IHRoZW0gaW4gdGhlIEVWRU5UX1RZUEVTIGNvbnN0YW50XG4gICAgICogdGhlIGBvblRvdWNoYCBtZXRob2QgaXMgYmluZCB0byB0aGVzZSBwcm9wZXJ0aWVzLlxuICAgICAqIEBtZXRob2QgZGV0ZXJtaW5lRXZlbnRUeXBlc1xuICAgICAqIEByZXR1cm4ge09iamVjdH0gZXZlbnRzXG4gICAgICovXG4gICAgZGV0ZXJtaW5lRXZlbnRUeXBlczogZnVuY3Rpb24gZGV0ZXJtaW5lRXZlbnRUeXBlcygpIHtcbiAgICAgICAgdmFyIHR5cGVzO1xuICAgICAgICBpZihIYW1tZXIuSEFTX1BPSU5URVJFVkVOVFMpIHtcbiAgICAgICAgICAgIGlmKHdpbmRvdy5Qb2ludGVyRXZlbnQpIHtcbiAgICAgICAgICAgICAgICB0eXBlcyA9IFtcbiAgICAgICAgICAgICAgICAgICAgJ3BvaW50ZXJkb3duJyxcbiAgICAgICAgICAgICAgICAgICAgJ3BvaW50ZXJtb3ZlJyxcbiAgICAgICAgICAgICAgICAgICAgJ3BvaW50ZXJ1cCBwb2ludGVyY2FuY2VsIGxvc3Rwb2ludGVyY2FwdHVyZSdcbiAgICAgICAgICAgICAgICBdO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0eXBlcyA9IFtcbiAgICAgICAgICAgICAgICAgICAgJ01TUG9pbnRlckRvd24nLFxuICAgICAgICAgICAgICAgICAgICAnTVNQb2ludGVyTW92ZScsXG4gICAgICAgICAgICAgICAgICAgICdNU1BvaW50ZXJVcCBNU1BvaW50ZXJDYW5jZWwgTVNMb3N0UG9pbnRlckNhcHR1cmUnXG4gICAgICAgICAgICAgICAgXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmKEhhbW1lci5OT19NT1VTRUVWRU5UUykge1xuICAgICAgICAgICAgdHlwZXMgPSBbXG4gICAgICAgICAgICAgICAgJ3RvdWNoc3RhcnQnLFxuICAgICAgICAgICAgICAgICd0b3VjaG1vdmUnLFxuICAgICAgICAgICAgICAgICd0b3VjaGVuZCB0b3VjaGNhbmNlbCdcbiAgICAgICAgICAgIF07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0eXBlcyA9IFtcbiAgICAgICAgICAgICAgICAndG91Y2hzdGFydCBtb3VzZWRvd24nLFxuICAgICAgICAgICAgICAgICd0b3VjaG1vdmUgbW91c2Vtb3ZlJyxcbiAgICAgICAgICAgICAgICAndG91Y2hlbmQgdG91Y2hjYW5jZWwgbW91c2V1cCdcbiAgICAgICAgICAgIF07XG4gICAgICAgIH1cblxuICAgICAgICBFVkVOVF9UWVBFU1tFVkVOVF9TVEFSVF0gPSB0eXBlc1swXTtcbiAgICAgICAgRVZFTlRfVFlQRVNbRVZFTlRfTU9WRV0gPSB0eXBlc1sxXTtcbiAgICAgICAgRVZFTlRfVFlQRVNbRVZFTlRfRU5EXSA9IHR5cGVzWzJdO1xuICAgICAgICByZXR1cm4gRVZFTlRfVFlQRVM7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIGNyZWF0ZSB0b3VjaExpc3QgZGVwZW5kaW5nIG9uIHRoZSBldmVudFxuICAgICAqIEBtZXRob2QgZ2V0VG91Y2hMaXN0XG4gICAgICogQHBhcmFtIHtPYmplY3R9IGV2XG4gICAgICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50VHlwZVxuICAgICAqIEByZXR1cm4ge0FycmF5fSB0b3VjaGVzXG4gICAgICovXG4gICAgZ2V0VG91Y2hMaXN0OiBmdW5jdGlvbiBnZXRUb3VjaExpc3QoZXYsIGV2ZW50VHlwZSkge1xuICAgICAgICAvLyBnZXQgdGhlIGZha2UgcG9pbnRlckV2ZW50IHRvdWNobGlzdFxuICAgICAgICBpZihIYW1tZXIuSEFTX1BPSU5URVJFVkVOVFMpIHtcbiAgICAgICAgICAgIHJldHVybiBQb2ludGVyRXZlbnQuZ2V0VG91Y2hMaXN0KCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBnZXQgdGhlIHRvdWNobGlzdFxuICAgICAgICBpZihldi50b3VjaGVzKSB7XG4gICAgICAgICAgICBpZihldmVudFR5cGUgPT0gRVZFTlRfTU9WRSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBldi50b3VjaGVzO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgaWRlbnRpZmllcnMgPSBbXTtcbiAgICAgICAgICAgIHZhciBjb25jYXQgPSBbXS5jb25jYXQoVXRpbHMudG9BcnJheShldi50b3VjaGVzKSwgVXRpbHMudG9BcnJheShldi5jaGFuZ2VkVG91Y2hlcykpO1xuICAgICAgICAgICAgdmFyIHRvdWNoTGlzdCA9IFtdO1xuXG4gICAgICAgICAgICBVdGlscy5lYWNoKGNvbmNhdCwgZnVuY3Rpb24odG91Y2gpIHtcbiAgICAgICAgICAgICAgICBpZihVdGlscy5pbkFycmF5KGlkZW50aWZpZXJzLCB0b3VjaC5pZGVudGlmaWVyKSA9PT0gZmFsc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgdG91Y2hMaXN0LnB1c2godG91Y2gpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZGVudGlmaWVycy5wdXNoKHRvdWNoLmlkZW50aWZpZXIpO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIHJldHVybiB0b3VjaExpc3Q7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBtYWtlIGZha2UgdG91Y2hMaXN0IGZyb20gbW91c2UgcG9zaXRpb25cbiAgICAgICAgZXYuaWRlbnRpZmllciA9IDE7XG4gICAgICAgIHJldHVybiBbZXZdO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBjb2xsZWN0IGJhc2ljIGV2ZW50IGRhdGFcbiAgICAgKiBAbWV0aG9kIGNvbGxlY3RFdmVudERhdGFcbiAgICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlbGVtZW50XG4gICAgICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50VHlwZSBtYXRjaGVzIGBFVkVOVF9TVEFSVHxNT1ZFfEVORGBcbiAgICAgKiBAcGFyYW0ge0FycmF5fSB0b3VjaGVzXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGV2XG4gICAgICogQHJldHVybiB7T2JqZWN0fSBldlxuICAgICAqL1xuICAgIGNvbGxlY3RFdmVudERhdGE6IGZ1bmN0aW9uIGNvbGxlY3RFdmVudERhdGEoZWxlbWVudCwgZXZlbnRUeXBlLCB0b3VjaGVzLCBldikge1xuICAgICAgICAvLyBmaW5kIG91dCBwb2ludGVyVHlwZVxuICAgICAgICB2YXIgcG9pbnRlclR5cGUgPSBQT0lOVEVSX1RPVUNIO1xuICAgICAgICBpZihVdGlscy5pblN0cihldi50eXBlLCAnbW91c2UnKSB8fCBQb2ludGVyRXZlbnQubWF0Y2hUeXBlKFBPSU5URVJfTU9VU0UsIGV2KSkge1xuICAgICAgICAgICAgcG9pbnRlclR5cGUgPSBQT0lOVEVSX01PVVNFO1xuICAgICAgICB9IGVsc2UgaWYoUG9pbnRlckV2ZW50Lm1hdGNoVHlwZShQT0lOVEVSX1BFTiwgZXYpKSB7XG4gICAgICAgICAgICBwb2ludGVyVHlwZSA9IFBPSU5URVJfUEVOO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGNlbnRlcjogVXRpbHMuZ2V0Q2VudGVyKHRvdWNoZXMpLFxuICAgICAgICAgICAgdGltZVN0YW1wOiBEYXRlLm5vdygpLFxuICAgICAgICAgICAgdGFyZ2V0OiBldi50YXJnZXQsXG4gICAgICAgICAgICB0b3VjaGVzOiB0b3VjaGVzLFxuICAgICAgICAgICAgZXZlbnRUeXBlOiBldmVudFR5cGUsXG4gICAgICAgICAgICBwb2ludGVyVHlwZTogcG9pbnRlclR5cGUsXG4gICAgICAgICAgICBzcmNFdmVudDogZXYsXG5cbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogcHJldmVudCB0aGUgYnJvd3NlciBkZWZhdWx0IGFjdGlvbnNcbiAgICAgICAgICAgICAqIG1vc3RseSB1c2VkIHRvIGRpc2FibGUgc2Nyb2xsaW5nIG9mIHRoZSBicm93c2VyXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIHByZXZlbnREZWZhdWx0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICB2YXIgc3JjRXZlbnQgPSB0aGlzLnNyY0V2ZW50O1xuICAgICAgICAgICAgICAgIHNyY0V2ZW50LnByZXZlbnRNYW5pcHVsYXRpb24gJiYgc3JjRXZlbnQucHJldmVudE1hbmlwdWxhdGlvbigpO1xuICAgICAgICAgICAgICAgIHNyY0V2ZW50LnByZXZlbnREZWZhdWx0ICYmIHNyY0V2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIHN0b3AgYnViYmxpbmcgdGhlIGV2ZW50IHVwIHRvIGl0cyBwYXJlbnRzXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIHN0b3BQcm9wYWdhdGlvbjogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zcmNFdmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogaW1tZWRpYXRlbHkgc3RvcCBnZXN0dXJlIGRldGVjdGlvblxuICAgICAgICAgICAgICogbWlnaHQgYmUgdXNlZnVsIGFmdGVyIGEgc3dpcGUgd2FzIGRldGVjdGVkXG4gICAgICAgICAgICAgKiBAcmV0dXJuIHsqfVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBzdG9wRGV0ZWN0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gRGV0ZWN0aW9uLnN0b3BEZXRlY3QoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG59O1xuXG5cbi8qKlxuICogQG1vZHVsZSBoYW1tZXJcbiAqXG4gKiBAY2xhc3MgUG9pbnRlckV2ZW50XG4gKiBAc3RhdGljXG4gKi9cbnZhciBQb2ludGVyRXZlbnQgPSBIYW1tZXIuUG9pbnRlckV2ZW50ID0ge1xuICAgIC8qKlxuICAgICAqIGhvbGRzIGFsbCBwb2ludGVycywgYnkgYGlkZW50aWZpZXJgXG4gICAgICogQHByb3BlcnR5IHBvaW50ZXJzXG4gICAgICogQHR5cGUge09iamVjdH1cbiAgICAgKi9cbiAgICBwb2ludGVyczoge30sXG5cbiAgICAvKipcbiAgICAgKiBnZXQgdGhlIHBvaW50ZXJzIGFzIGFuIGFycmF5XG4gICAgICogQG1ldGhvZCBnZXRUb3VjaExpc3RcbiAgICAgKiBAcmV0dXJuIHtBcnJheX0gdG91Y2hsaXN0XG4gICAgICovXG4gICAgZ2V0VG91Y2hMaXN0OiBmdW5jdGlvbiBnZXRUb3VjaExpc3QoKSB7XG4gICAgICAgIHZhciB0b3VjaGxpc3QgPSBbXTtcbiAgICAgICAgLy8gd2UgY2FuIHVzZSBmb3JFYWNoIHNpbmNlIHBvaW50ZXJFdmVudHMgb25seSBpcyBpbiBJRTEwXG4gICAgICAgIFV0aWxzLmVhY2godGhpcy5wb2ludGVycywgZnVuY3Rpb24ocG9pbnRlcikge1xuICAgICAgICAgICAgdG91Y2hsaXN0LnB1c2gocG9pbnRlcik7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiB0b3VjaGxpc3Q7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIHVwZGF0ZSB0aGUgcG9zaXRpb24gb2YgYSBwb2ludGVyXG4gICAgICogQG1ldGhvZCB1cGRhdGVQb2ludGVyXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50VHlwZSBtYXRjaGVzIGBFVkVOVF9TVEFSVHxNT1ZFfEVORGBcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gcG9pbnRlckV2ZW50XG4gICAgICovXG4gICAgdXBkYXRlUG9pbnRlcjogZnVuY3Rpb24gdXBkYXRlUG9pbnRlcihldmVudFR5cGUsIHBvaW50ZXJFdmVudCkge1xuICAgICAgICBpZihldmVudFR5cGUgPT0gRVZFTlRfRU5EKSB7XG4gICAgICAgICAgICBkZWxldGUgdGhpcy5wb2ludGVyc1twb2ludGVyRXZlbnQucG9pbnRlcklkXTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHBvaW50ZXJFdmVudC5pZGVudGlmaWVyID0gcG9pbnRlckV2ZW50LnBvaW50ZXJJZDtcbiAgICAgICAgICAgIHRoaXMucG9pbnRlcnNbcG9pbnRlckV2ZW50LnBvaW50ZXJJZF0gPSBwb2ludGVyRXZlbnQ7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogY2hlY2sgaWYgZXYgbWF0Y2hlcyBwb2ludGVydHlwZVxuICAgICAqIEBtZXRob2QgbWF0Y2hUeXBlXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHBvaW50ZXJUeXBlIG1hdGNoZXMgYFBPSU5URVJfTU9VU0V8VE9VQ0h8UEVOYFxuICAgICAqIEBwYXJhbSB7UG9pbnRlckV2ZW50fSBldlxuICAgICAqL1xuICAgIG1hdGNoVHlwZTogZnVuY3Rpb24gbWF0Y2hUeXBlKHBvaW50ZXJUeXBlLCBldikge1xuICAgICAgICBpZighZXYucG9pbnRlclR5cGUpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBwdCA9IGV2LnBvaW50ZXJUeXBlLFxuICAgICAgICAgICAgdHlwZXMgPSB7fTtcblxuICAgICAgICB0eXBlc1tQT0lOVEVSX01PVVNFXSA9IChwdCA9PT0gKGV2Lk1TUE9JTlRFUl9UWVBFX01PVVNFIHx8IFBPSU5URVJfTU9VU0UpKTtcbiAgICAgICAgdHlwZXNbUE9JTlRFUl9UT1VDSF0gPSAocHQgPT09IChldi5NU1BPSU5URVJfVFlQRV9UT1VDSCB8fCBQT0lOVEVSX1RPVUNIKSk7XG4gICAgICAgIHR5cGVzW1BPSU5URVJfUEVOXSA9IChwdCA9PT0gKGV2Lk1TUE9JTlRFUl9UWVBFX1BFTiB8fCBQT0lOVEVSX1BFTikpO1xuICAgICAgICByZXR1cm4gdHlwZXNbcG9pbnRlclR5cGVdO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiByZXNldCB0aGUgc3RvcmVkIHBvaW50ZXJzXG4gICAgICogQG1ldGhvZCByZXNldFxuICAgICAqL1xuICAgIHJlc2V0OiBmdW5jdGlvbiByZXNldExpc3QoKSB7XG4gICAgICAgIHRoaXMucG9pbnRlcnMgPSB7fTtcbiAgICB9XG59O1xuXG5cbi8qKlxuICogQG1vZHVsZSBoYW1tZXJcbiAqXG4gKiBAY2xhc3MgRGV0ZWN0aW9uXG4gKiBAc3RhdGljXG4gKi9cbnZhciBEZXRlY3Rpb24gPSBIYW1tZXIuZGV0ZWN0aW9uID0ge1xuICAgIC8vIGNvbnRhaW5zIGFsbCByZWdpc3RyZWQgSGFtbWVyLmdlc3R1cmVzIGluIHRoZSBjb3JyZWN0IG9yZGVyXG4gICAgZ2VzdHVyZXM6IFtdLFxuXG4gICAgLy8gZGF0YSBvZiB0aGUgY3VycmVudCBIYW1tZXIuZ2VzdHVyZSBkZXRlY3Rpb24gc2Vzc2lvblxuICAgIGN1cnJlbnQ6IG51bGwsXG5cbiAgICAvLyB0aGUgcHJldmlvdXMgSGFtbWVyLmdlc3R1cmUgc2Vzc2lvbiBkYXRhXG4gICAgLy8gaXMgYSBmdWxsIGNsb25lIG9mIHRoZSBwcmV2aW91cyBnZXN0dXJlLmN1cnJlbnQgb2JqZWN0XG4gICAgcHJldmlvdXM6IG51bGwsXG5cbiAgICAvLyB3aGVuIHRoaXMgYmVjb21lcyB0cnVlLCBubyBnZXN0dXJlcyBhcmUgZmlyZWRcbiAgICBzdG9wcGVkOiBmYWxzZSxcblxuICAgIC8qKlxuICAgICAqIHN0YXJ0IEhhbW1lci5nZXN0dXJlIGRldGVjdGlvblxuICAgICAqIEBtZXRob2Qgc3RhcnREZXRlY3RcbiAgICAgKiBAcGFyYW0ge0hhbW1lci5JbnN0YW5jZX0gaW5zdFxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBldmVudERhdGFcbiAgICAgKi9cbiAgICBzdGFydERldGVjdDogZnVuY3Rpb24gc3RhcnREZXRlY3QoaW5zdCwgZXZlbnREYXRhKSB7XG4gICAgICAgIC8vIGFscmVhZHkgYnVzeSB3aXRoIGEgSGFtbWVyLmdlc3R1cmUgZGV0ZWN0aW9uIG9uIGFuIGVsZW1lbnRcbiAgICAgICAgaWYodGhpcy5jdXJyZW50KSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnN0b3BwZWQgPSBmYWxzZTtcblxuICAgICAgICAvLyBob2xkcyBjdXJyZW50IHNlc3Npb25cbiAgICAgICAgdGhpcy5jdXJyZW50ID0ge1xuICAgICAgICAgICAgaW5zdDogaW5zdCwgLy8gcmVmZXJlbmNlIHRvIEhhbW1lckluc3RhbmNlIHdlJ3JlIHdvcmtpbmcgZm9yXG4gICAgICAgICAgICBzdGFydEV2ZW50OiBVdGlscy5leHRlbmQoe30sIGV2ZW50RGF0YSksIC8vIHN0YXJ0IGV2ZW50RGF0YSBmb3IgZGlzdGFuY2VzLCB0aW1pbmcgZXRjXG4gICAgICAgICAgICBsYXN0RXZlbnQ6IGZhbHNlLCAvLyBsYXN0IGV2ZW50RGF0YVxuICAgICAgICAgICAgbGFzdENhbGNFdmVudDogZmFsc2UsIC8vIGxhc3QgZXZlbnREYXRhIGZvciBjYWxjdWxhdGlvbnMuXG4gICAgICAgICAgICBmdXR1cmVDYWxjRXZlbnQ6IGZhbHNlLCAvLyBsYXN0IGV2ZW50RGF0YSBmb3IgY2FsY3VsYXRpb25zLlxuICAgICAgICAgICAgbGFzdENhbGNEYXRhOiB7fSwgLy8gbGFzdCBsYXN0Q2FsY0RhdGFcbiAgICAgICAgICAgIG5hbWU6ICcnIC8vIGN1cnJlbnQgZ2VzdHVyZSB3ZSdyZSBpbi9kZXRlY3RlZCwgY2FuIGJlICd0YXAnLCAnaG9sZCcgZXRjXG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5kZXRlY3QoZXZlbnREYXRhKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogSGFtbWVyLmdlc3R1cmUgZGV0ZWN0aW9uXG4gICAgICogQG1ldGhvZCBkZXRlY3RcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gZXZlbnREYXRhXG4gICAgICogQHJldHVybiB7YW55fVxuICAgICAqL1xuICAgIGRldGVjdDogZnVuY3Rpb24gZGV0ZWN0KGV2ZW50RGF0YSkge1xuICAgICAgICBpZighdGhpcy5jdXJyZW50IHx8IHRoaXMuc3RvcHBlZCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gZXh0ZW5kIGV2ZW50IGRhdGEgd2l0aCBjYWxjdWxhdGlvbnMgYWJvdXQgc2NhbGUsIGRpc3RhbmNlIGV0Y1xuICAgICAgICBldmVudERhdGEgPSB0aGlzLmV4dGVuZEV2ZW50RGF0YShldmVudERhdGEpO1xuXG4gICAgICAgIC8vIGhhbW1lciBpbnN0YW5jZSBhbmQgaW5zdGFuY2Ugb3B0aW9uc1xuICAgICAgICB2YXIgaW5zdCA9IHRoaXMuY3VycmVudC5pbnN0LFxuICAgICAgICAgICAgaW5zdE9wdGlvbnMgPSBpbnN0Lm9wdGlvbnM7XG5cbiAgICAgICAgLy8gY2FsbCBIYW1tZXIuZ2VzdHVyZSBoYW5kbGVyc1xuICAgICAgICBVdGlscy5lYWNoKHRoaXMuZ2VzdHVyZXMsIGZ1bmN0aW9uIHRyaWdnZXJHZXN0dXJlKGdlc3R1cmUpIHtcbiAgICAgICAgICAgIC8vIG9ubHkgd2hlbiB0aGUgaW5zdGFuY2Ugb3B0aW9ucyBoYXZlIGVuYWJsZWQgdGhpcyBnZXN0dXJlXG4gICAgICAgICAgICBpZighdGhpcy5zdG9wcGVkICYmIGluc3QuZW5hYmxlZCAmJiBpbnN0T3B0aW9uc1tnZXN0dXJlLm5hbWVdKSB7XG4gICAgICAgICAgICAgICAgZ2VzdHVyZS5oYW5kbGVyLmNhbGwoZ2VzdHVyZSwgZXZlbnREYXRhLCBpbnN0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgdGhpcyk7XG5cbiAgICAgICAgLy8gc3RvcmUgYXMgcHJldmlvdXMgZXZlbnQgZXZlbnRcbiAgICAgICAgaWYodGhpcy5jdXJyZW50KSB7XG4gICAgICAgICAgICB0aGlzLmN1cnJlbnQubGFzdEV2ZW50ID0gZXZlbnREYXRhO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYoZXZlbnREYXRhLmV2ZW50VHlwZSA9PSBFVkVOVF9FTkQpIHtcbiAgICAgICAgICAgIHRoaXMuc3RvcERldGVjdCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGV2ZW50RGF0YTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogY2xlYXIgdGhlIEhhbW1lci5nZXN0dXJlIHZhcnNcbiAgICAgKiB0aGlzIGlzIGNhbGxlZCBvbiBlbmREZXRlY3QsIGJ1dCBjYW4gYWxzbyBiZSB1c2VkIHdoZW4gYSBmaW5hbCBIYW1tZXIuZ2VzdHVyZSBoYXMgYmVlbiBkZXRlY3RlZFxuICAgICAqIHRvIHN0b3Agb3RoZXIgSGFtbWVyLmdlc3R1cmVzIGZyb20gYmVpbmcgZmlyZWRcbiAgICAgKiBAbWV0aG9kIHN0b3BEZXRlY3RcbiAgICAgKi9cbiAgICBzdG9wRGV0ZWN0OiBmdW5jdGlvbiBzdG9wRGV0ZWN0KCkge1xuICAgICAgICAvLyBjbG9uZSBjdXJyZW50IGRhdGEgdG8gdGhlIHN0b3JlIGFzIHRoZSBwcmV2aW91cyBnZXN0dXJlXG4gICAgICAgIC8vIHVzZWQgZm9yIHRoZSBkb3VibGUgdGFwIGdlc3R1cmUsIHNpbmNlIHRoaXMgaXMgYW4gb3RoZXIgZ2VzdHVyZSBkZXRlY3Qgc2Vzc2lvblxuICAgICAgICB0aGlzLnByZXZpb3VzID0gVXRpbHMuZXh0ZW5kKHt9LCB0aGlzLmN1cnJlbnQpO1xuXG4gICAgICAgIC8vIHJlc2V0IHRoZSBjdXJyZW50XG4gICAgICAgIHRoaXMuY3VycmVudCA9IG51bGw7XG4gICAgICAgIHRoaXMuc3RvcHBlZCA9IHRydWU7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIGNhbGN1bGF0ZSB2ZWxvY2l0eSwgYW5nbGUgYW5kIGRpcmVjdGlvblxuICAgICAqIEBtZXRob2QgZ2V0VmVsb2NpdHlEYXRhXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGV2XG4gICAgICogQHBhcmFtIHtPYmplY3R9IGNlbnRlclxuICAgICAqIEBwYXJhbSB7TnVtYmVyfSBkZWx0YVRpbWVcbiAgICAgKiBAcGFyYW0ge051bWJlcn0gZGVsdGFYXG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IGRlbHRhWVxuICAgICAqL1xuICAgIGdldENhbGN1bGF0ZWREYXRhOiBmdW5jdGlvbiBnZXRDYWxjdWxhdGVkRGF0YShldiwgY2VudGVyLCBkZWx0YVRpbWUsIGRlbHRhWCwgZGVsdGFZKSB7XG4gICAgICAgIHZhciBjdXIgPSB0aGlzLmN1cnJlbnQsXG4gICAgICAgICAgICByZWNhbGMgPSBmYWxzZSxcbiAgICAgICAgICAgIGNhbGNFdiA9IGN1ci5sYXN0Q2FsY0V2ZW50LFxuICAgICAgICAgICAgY2FsY0RhdGEgPSBjdXIubGFzdENhbGNEYXRhO1xuXG4gICAgICAgIGlmKGNhbGNFdiAmJiBldi50aW1lU3RhbXAgLSBjYWxjRXYudGltZVN0YW1wID4gSGFtbWVyLkNBTENVTEFURV9JTlRFUlZBTCkge1xuICAgICAgICAgICAgY2VudGVyID0gY2FsY0V2LmNlbnRlcjtcbiAgICAgICAgICAgIGRlbHRhVGltZSA9IGV2LnRpbWVTdGFtcCAtIGNhbGNFdi50aW1lU3RhbXA7XG4gICAgICAgICAgICBkZWx0YVggPSBldi5jZW50ZXIuY2xpZW50WCAtIGNhbGNFdi5jZW50ZXIuY2xpZW50WDtcbiAgICAgICAgICAgIGRlbHRhWSA9IGV2LmNlbnRlci5jbGllbnRZIC0gY2FsY0V2LmNlbnRlci5jbGllbnRZO1xuICAgICAgICAgICAgcmVjYWxjID0gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmKGV2LmV2ZW50VHlwZSA9PSBFVkVOVF9UT1VDSCB8fCBldi5ldmVudFR5cGUgPT0gRVZFTlRfUkVMRUFTRSkge1xuICAgICAgICAgICAgY3VyLmZ1dHVyZUNhbGNFdmVudCA9IGV2O1xuICAgICAgICB9XG5cbiAgICAgICAgaWYoIWN1ci5sYXN0Q2FsY0V2ZW50IHx8IHJlY2FsYykge1xuICAgICAgICAgICAgY2FsY0RhdGEudmVsb2NpdHkgPSBVdGlscy5nZXRWZWxvY2l0eShkZWx0YVRpbWUsIGRlbHRhWCwgZGVsdGFZKTtcbiAgICAgICAgICAgIGNhbGNEYXRhLmFuZ2xlID0gVXRpbHMuZ2V0QW5nbGUoY2VudGVyLCBldi5jZW50ZXIpO1xuICAgICAgICAgICAgY2FsY0RhdGEuZGlyZWN0aW9uID0gVXRpbHMuZ2V0RGlyZWN0aW9uKGNlbnRlciwgZXYuY2VudGVyKTtcblxuICAgICAgICAgICAgY3VyLmxhc3RDYWxjRXZlbnQgPSBjdXIuZnV0dXJlQ2FsY0V2ZW50IHx8IGV2O1xuICAgICAgICAgICAgY3VyLmZ1dHVyZUNhbGNFdmVudCA9IGV2O1xuICAgICAgICB9XG5cbiAgICAgICAgZXYudmVsb2NpdHlYID0gY2FsY0RhdGEudmVsb2NpdHkueDtcbiAgICAgICAgZXYudmVsb2NpdHlZID0gY2FsY0RhdGEudmVsb2NpdHkueTtcbiAgICAgICAgZXYuaW50ZXJpbUFuZ2xlID0gY2FsY0RhdGEuYW5nbGU7XG4gICAgICAgIGV2LmludGVyaW1EaXJlY3Rpb24gPSBjYWxjRGF0YS5kaXJlY3Rpb247XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIGV4dGVuZCBldmVudERhdGEgZm9yIEhhbW1lci5nZXN0dXJlc1xuICAgICAqIEBtZXRob2QgZXh0ZW5kRXZlbnREYXRhXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGV2XG4gICAgICogQHJldHVybiB7T2JqZWN0fSBldlxuICAgICAqL1xuICAgIGV4dGVuZEV2ZW50RGF0YTogZnVuY3Rpb24gZXh0ZW5kRXZlbnREYXRhKGV2KSB7XG4gICAgICAgIHZhciBjdXIgPSB0aGlzLmN1cnJlbnQsXG4gICAgICAgICAgICBzdGFydEV2ID0gY3VyLnN0YXJ0RXZlbnQsXG4gICAgICAgICAgICBsYXN0RXYgPSBjdXIubGFzdEV2ZW50IHx8IHN0YXJ0RXY7XG5cbiAgICAgICAgLy8gdXBkYXRlIHRoZSBzdGFydCB0b3VjaGxpc3QgdG8gY2FsY3VsYXRlIHRoZSBzY2FsZS9yb3RhdGlvblxuICAgICAgICBpZihldi5ldmVudFR5cGUgPT0gRVZFTlRfVE9VQ0ggfHwgZXYuZXZlbnRUeXBlID09IEVWRU5UX1JFTEVBU0UpIHtcbiAgICAgICAgICAgIHN0YXJ0RXYudG91Y2hlcyA9IFtdO1xuICAgICAgICAgICAgVXRpbHMuZWFjaChldi50b3VjaGVzLCBmdW5jdGlvbih0b3VjaCkge1xuICAgICAgICAgICAgICAgIHN0YXJ0RXYudG91Y2hlcy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgY2xpZW50WDogdG91Y2guY2xpZW50WCxcbiAgICAgICAgICAgICAgICAgICAgY2xpZW50WTogdG91Y2guY2xpZW50WVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgZGVsdGFUaW1lID0gZXYudGltZVN0YW1wIC0gc3RhcnRFdi50aW1lU3RhbXAsXG4gICAgICAgICAgICBkZWx0YVggPSBldi5jZW50ZXIuY2xpZW50WCAtIHN0YXJ0RXYuY2VudGVyLmNsaWVudFgsXG4gICAgICAgICAgICBkZWx0YVkgPSBldi5jZW50ZXIuY2xpZW50WSAtIHN0YXJ0RXYuY2VudGVyLmNsaWVudFk7XG5cbiAgICAgICAgdGhpcy5nZXRDYWxjdWxhdGVkRGF0YShldiwgbGFzdEV2LmNlbnRlciwgZGVsdGFUaW1lLCBkZWx0YVgsIGRlbHRhWSk7XG5cbiAgICAgICAgVXRpbHMuZXh0ZW5kKGV2LCB7XG4gICAgICAgICAgICBzdGFydEV2ZW50OiBzdGFydEV2LFxuXG4gICAgICAgICAgICBkZWx0YVRpbWU6IGRlbHRhVGltZSxcbiAgICAgICAgICAgIGRlbHRhWDogZGVsdGFYLFxuICAgICAgICAgICAgZGVsdGFZOiBkZWx0YVksXG5cbiAgICAgICAgICAgIGRpc3RhbmNlOiBVdGlscy5nZXREaXN0YW5jZShzdGFydEV2LmNlbnRlciwgZXYuY2VudGVyKSxcbiAgICAgICAgICAgIGFuZ2xlOiBVdGlscy5nZXRBbmdsZShzdGFydEV2LmNlbnRlciwgZXYuY2VudGVyKSxcbiAgICAgICAgICAgIGRpcmVjdGlvbjogVXRpbHMuZ2V0RGlyZWN0aW9uKHN0YXJ0RXYuY2VudGVyLCBldi5jZW50ZXIpLFxuICAgICAgICAgICAgc2NhbGU6IFV0aWxzLmdldFNjYWxlKHN0YXJ0RXYudG91Y2hlcywgZXYudG91Y2hlcyksXG4gICAgICAgICAgICByb3RhdGlvbjogVXRpbHMuZ2V0Um90YXRpb24oc3RhcnRFdi50b3VjaGVzLCBldi50b3VjaGVzKVxuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gZXY7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIHJlZ2lzdGVyIG5ldyBnZXN0dXJlXG4gICAgICogQG1ldGhvZCByZWdpc3RlclxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBnZXN0dXJlIG9iamVjdCwgc2VlIGBnZXN0dXJlcy9gIGZvciBkb2N1bWVudGF0aW9uXG4gICAgICogQHJldHVybiB7QXJyYXl9IGdlc3R1cmVzXG4gICAgICovXG4gICAgcmVnaXN0ZXI6IGZ1bmN0aW9uIHJlZ2lzdGVyKGdlc3R1cmUpIHtcbiAgICAgICAgLy8gYWRkIGFuIGVuYWJsZSBnZXN0dXJlIG9wdGlvbnMgaWYgdGhlcmUgaXMgbm8gZ2l2ZW5cbiAgICAgICAgdmFyIG9wdGlvbnMgPSBnZXN0dXJlLmRlZmF1bHRzIHx8IHt9O1xuICAgICAgICBpZihvcHRpb25zW2dlc3R1cmUubmFtZV0gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgb3B0aW9uc1tnZXN0dXJlLm5hbWVdID0gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGV4dGVuZCBIYW1tZXIgZGVmYXVsdCBvcHRpb25zIHdpdGggdGhlIEhhbW1lci5nZXN0dXJlIG9wdGlvbnNcbiAgICAgICAgVXRpbHMuZXh0ZW5kKEhhbW1lci5kZWZhdWx0cywgb3B0aW9ucywgdHJ1ZSk7XG5cbiAgICAgICAgLy8gc2V0IGl0cyBpbmRleFxuICAgICAgICBnZXN0dXJlLmluZGV4ID0gZ2VzdHVyZS5pbmRleCB8fCAxMDAwO1xuXG4gICAgICAgIC8vIGFkZCBIYW1tZXIuZ2VzdHVyZSB0byB0aGUgbGlzdFxuICAgICAgICB0aGlzLmdlc3R1cmVzLnB1c2goZ2VzdHVyZSk7XG5cbiAgICAgICAgLy8gc29ydCB0aGUgbGlzdCBieSBpbmRleFxuICAgICAgICB0aGlzLmdlc3R1cmVzLnNvcnQoZnVuY3Rpb24oYSwgYikge1xuICAgICAgICAgICAgaWYoYS5pbmRleCA8IGIuaW5kZXgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gLTE7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZihhLmluZGV4ID4gYi5pbmRleCkge1xuICAgICAgICAgICAgICAgIHJldHVybiAxO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIDA7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiB0aGlzLmdlc3R1cmVzO1xuICAgIH1cbn07XG5cblxuLyoqXG4gKiBAbW9kdWxlIGhhbW1lclxuICovXG5cbi8qKlxuICogY3JlYXRlIG5ldyBoYW1tZXIgaW5zdGFuY2VcbiAqIGFsbCBtZXRob2RzIHNob3VsZCByZXR1cm4gdGhlIGluc3RhbmNlIGl0c2VsZiwgc28gaXQgaXMgY2hhaW5hYmxlLlxuICpcbiAqIEBjbGFzcyBJbnN0YW5jZVxuICogQGNvbnN0cnVjdG9yXG4gKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlbGVtZW50XG4gKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnM9e31dIG9wdGlvbnMgYXJlIG1lcmdlZCB3aXRoIGBIYW1tZXIuZGVmYXVsdHNgXG4gKiBAcmV0dXJuIHtIYW1tZXIuSW5zdGFuY2V9XG4gKi9cbkhhbW1lci5JbnN0YW5jZSA9IGZ1bmN0aW9uKGVsZW1lbnQsIG9wdGlvbnMpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAvLyBzZXR1cCBIYW1tZXJKUyB3aW5kb3cgZXZlbnRzIGFuZCByZWdpc3RlciBhbGwgZ2VzdHVyZXNcbiAgICAvLyB0aGlzIGFsc28gc2V0cyB1cCB0aGUgZGVmYXVsdCBvcHRpb25zXG4gICAgc2V0dXAoKTtcblxuICAgIC8qKlxuICAgICAqIEBwcm9wZXJ0eSBlbGVtZW50XG4gICAgICogQHR5cGUge0hUTUxFbGVtZW50fVxuICAgICAqL1xuICAgIHRoaXMuZWxlbWVudCA9IGVsZW1lbnQ7XG5cbiAgICAvKipcbiAgICAgKiBAcHJvcGVydHkgZW5hYmxlZFxuICAgICAqIEB0eXBlIHtCb29sZWFufVxuICAgICAqIEBwcm90ZWN0ZWRcbiAgICAgKi9cbiAgICB0aGlzLmVuYWJsZWQgPSB0cnVlO1xuXG4gICAgLyoqXG4gICAgICogb3B0aW9ucywgbWVyZ2VkIHdpdGggdGhlIGRlZmF1bHRzXG4gICAgICogb3B0aW9ucyB3aXRoIGFuIF8gYXJlIGNvbnZlcnRlZCB0byBjYW1lbENhc2VcbiAgICAgKiBAcHJvcGVydHkgb3B0aW9uc1xuICAgICAqIEB0eXBlIHtPYmplY3R9XG4gICAgICovXG4gICAgVXRpbHMuZWFjaChvcHRpb25zLCBmdW5jdGlvbih2YWx1ZSwgbmFtZSkge1xuICAgICAgICBkZWxldGUgb3B0aW9uc1tuYW1lXTtcbiAgICAgICAgb3B0aW9uc1tVdGlscy50b0NhbWVsQ2FzZShuYW1lKV0gPSB2YWx1ZTtcbiAgICB9KTtcblxuICAgIHRoaXMub3B0aW9ucyA9IFV0aWxzLmV4dGVuZChVdGlscy5leHRlbmQoe30sIEhhbW1lci5kZWZhdWx0cyksIG9wdGlvbnMgfHwge30pO1xuXG4gICAgLy8gYWRkIHNvbWUgY3NzIHRvIHRoZSBlbGVtZW50IHRvIHByZXZlbnQgdGhlIGJyb3dzZXIgZnJvbSBkb2luZyBpdHMgbmF0aXZlIGJlaGF2b2lyXG4gICAgaWYodGhpcy5vcHRpb25zLmJlaGF2aW9yKSB7XG4gICAgICAgIFV0aWxzLnRvZ2dsZUJlaGF2aW9yKHRoaXMuZWxlbWVudCwgdGhpcy5vcHRpb25zLmJlaGF2aW9yLCB0cnVlKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBldmVudCBzdGFydCBoYW5kbGVyIG9uIHRoZSBlbGVtZW50IHRvIHN0YXJ0IHRoZSBkZXRlY3Rpb25cbiAgICAgKiBAcHJvcGVydHkgZXZlbnRTdGFydEhhbmRsZXJcbiAgICAgKiBAdHlwZSB7T2JqZWN0fVxuICAgICAqL1xuICAgIHRoaXMuZXZlbnRTdGFydEhhbmRsZXIgPSBFdmVudC5vblRvdWNoKGVsZW1lbnQsIEVWRU5UX1NUQVJULCBmdW5jdGlvbihldikge1xuICAgICAgICBpZihzZWxmLmVuYWJsZWQgJiYgZXYuZXZlbnRUeXBlID09IEVWRU5UX1NUQVJUKSB7XG4gICAgICAgICAgICBEZXRlY3Rpb24uc3RhcnREZXRlY3Qoc2VsZiwgZXYpO1xuICAgICAgICB9IGVsc2UgaWYoZXYuZXZlbnRUeXBlID09IEVWRU5UX1RPVUNIKSB7XG4gICAgICAgICAgICBEZXRlY3Rpb24uZGV0ZWN0KGV2KTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgLyoqXG4gICAgICoga2VlcCBhIGxpc3Qgb2YgdXNlciBldmVudCBoYW5kbGVycyB3aGljaCBuZWVkcyB0byBiZSByZW1vdmVkIHdoZW4gY2FsbGluZyAnZGlzcG9zZSdcbiAgICAgKiBAcHJvcGVydHkgZXZlbnRIYW5kbGVyc1xuICAgICAqIEB0eXBlIHtBcnJheX1cbiAgICAgKi9cbiAgICB0aGlzLmV2ZW50SGFuZGxlcnMgPSBbXTtcbn07XG5cbkhhbW1lci5JbnN0YW5jZS5wcm90b3R5cGUgPSB7XG4gICAgLyoqXG4gICAgICogYmluZCBldmVudHMgdG8gdGhlIGluc3RhbmNlXG4gICAgICogQG1ldGhvZCBvblxuICAgICAqIEBjaGFpbmFibGVcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gZ2VzdHVyZXMgbXVsdGlwbGUgZ2VzdHVyZXMgYnkgc3BsaXR0aW5nIHdpdGggYSBzcGFjZVxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGhhbmRsZXJcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gaGFuZGxlci5ldiBldmVudCBvYmplY3RcbiAgICAgKi9cbiAgICBvbjogZnVuY3Rpb24gb25FdmVudChnZXN0dXJlcywgaGFuZGxlcikge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIEV2ZW50Lm9uKHNlbGYuZWxlbWVudCwgZ2VzdHVyZXMsIGhhbmRsZXIsIGZ1bmN0aW9uKHR5cGUpIHtcbiAgICAgICAgICAgIHNlbGYuZXZlbnRIYW5kbGVycy5wdXNoKHsgZ2VzdHVyZTogdHlwZSwgaGFuZGxlcjogaGFuZGxlciB9KTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBzZWxmO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiB1bmJpbmQgZXZlbnRzIHRvIHRoZSBpbnN0YW5jZVxuICAgICAqIEBtZXRob2Qgb2ZmXG4gICAgICogQGNoYWluYWJsZVxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBnZXN0dXJlc1xuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGhhbmRsZXJcbiAgICAgKi9cbiAgICBvZmY6IGZ1bmN0aW9uIG9mZkV2ZW50KGdlc3R1cmVzLCBoYW5kbGVyKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgICAgICBFdmVudC5vZmYoc2VsZi5lbGVtZW50LCBnZXN0dXJlcywgaGFuZGxlciwgZnVuY3Rpb24odHlwZSkge1xuICAgICAgICAgICAgdmFyIGluZGV4ID0gVXRpbHMuaW5BcnJheSh7IGdlc3R1cmU6IHR5cGUsIGhhbmRsZXI6IGhhbmRsZXIgfSk7XG4gICAgICAgICAgICBpZihpbmRleCAhPT0gZmFsc2UpIHtcbiAgICAgICAgICAgICAgICBzZWxmLmV2ZW50SGFuZGxlcnMuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBzZWxmO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiB0cmlnZ2VyIGdlc3R1cmUgZXZlbnRcbiAgICAgKiBAbWV0aG9kIHRyaWdnZXJcbiAgICAgKiBAY2hhaW5hYmxlXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IGdlc3R1cmVcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gW2V2ZW50RGF0YV1cbiAgICAgKi9cbiAgICB0cmlnZ2VyOiBmdW5jdGlvbiB0cmlnZ2VyRXZlbnQoZ2VzdHVyZSwgZXZlbnREYXRhKSB7XG4gICAgICAgIC8vIG9wdGlvbmFsXG4gICAgICAgIGlmKCFldmVudERhdGEpIHtcbiAgICAgICAgICAgIGV2ZW50RGF0YSA9IHt9O1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gY3JlYXRlIERPTSBldmVudFxuICAgICAgICB2YXIgZXZlbnQgPSBIYW1tZXIuRE9DVU1FTlQuY3JlYXRlRXZlbnQoJ0V2ZW50Jyk7XG4gICAgICAgIGV2ZW50LmluaXRFdmVudChnZXN0dXJlLCB0cnVlLCB0cnVlKTtcbiAgICAgICAgZXZlbnQuZ2VzdHVyZSA9IGV2ZW50RGF0YTtcblxuICAgICAgICAvLyB0cmlnZ2VyIG9uIHRoZSB0YXJnZXQgaWYgaXQgaXMgaW4gdGhlIGluc3RhbmNlIGVsZW1lbnQsXG4gICAgICAgIC8vIHRoaXMgaXMgZm9yIGV2ZW50IGRlbGVnYXRpb24gdHJpY2tzXG4gICAgICAgIHZhciBlbGVtZW50ID0gdGhpcy5lbGVtZW50O1xuICAgICAgICBpZihVdGlscy5oYXNQYXJlbnQoZXZlbnREYXRhLnRhcmdldCwgZWxlbWVudCkpIHtcbiAgICAgICAgICAgIGVsZW1lbnQgPSBldmVudERhdGEudGFyZ2V0O1xuICAgICAgICB9XG5cbiAgICAgICAgZWxlbWVudC5kaXNwYXRjaEV2ZW50KGV2ZW50KTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIGVuYWJsZSBvZiBkaXNhYmxlIGhhbW1lci5qcyBkZXRlY3Rpb25cbiAgICAgKiBAbWV0aG9kIGVuYWJsZVxuICAgICAqIEBjaGFpbmFibGVcbiAgICAgKiBAcGFyYW0ge0Jvb2xlYW59IHN0YXRlXG4gICAgICovXG4gICAgZW5hYmxlOiBmdW5jdGlvbiBlbmFibGUoc3RhdGUpIHtcbiAgICAgICAgdGhpcy5lbmFibGVkID0gc3RhdGU7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBkaXNwb3NlIHRoaXMgaGFtbWVyIGluc3RhbmNlXG4gICAgICogQG1ldGhvZCBkaXNwb3NlXG4gICAgICogQHJldHVybiB7TnVsbH1cbiAgICAgKi9cbiAgICBkaXNwb3NlOiBmdW5jdGlvbiBkaXNwb3NlKCkge1xuICAgICAgICB2YXIgaSwgZWg7XG5cbiAgICAgICAgLy8gdW5kbyBhbGwgY2hhbmdlcyBtYWRlIGJ5IHN0b3BfYnJvd3Nlcl9iZWhhdmlvclxuICAgICAgICBVdGlscy50b2dnbGVCZWhhdmlvcih0aGlzLmVsZW1lbnQsIHRoaXMub3B0aW9ucy5iZWhhdmlvciwgZmFsc2UpO1xuXG4gICAgICAgIC8vIHVuYmluZCBhbGwgY3VzdG9tIGV2ZW50IGhhbmRsZXJzXG4gICAgICAgIGZvcihpID0gLTE7IChlaCA9IHRoaXMuZXZlbnRIYW5kbGVyc1srK2ldKTspIHtcbiAgICAgICAgICAgIFV0aWxzLm9mZih0aGlzLmVsZW1lbnQsIGVoLmdlc3R1cmUsIGVoLmhhbmRsZXIpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5ldmVudEhhbmRsZXJzID0gW107XG5cbiAgICAgICAgLy8gdW5iaW5kIHRoZSBzdGFydCBldmVudCBsaXN0ZW5lclxuICAgICAgICBFdmVudC5vZmYodGhpcy5lbGVtZW50LCBFVkVOVF9UWVBFU1tFVkVOVF9TVEFSVF0sIHRoaXMuZXZlbnRTdGFydEhhbmRsZXIpO1xuXG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbn07XG5cblxuLyoqXG4gKiBAbW9kdWxlIGdlc3R1cmVzXG4gKi9cbi8qKlxuICogTW92ZSB3aXRoIHggZmluZ2VycyAoZGVmYXVsdCAxKSBhcm91bmQgb24gdGhlIHBhZ2UuXG4gKiBQcmV2ZW50aW5nIHRoZSBkZWZhdWx0IGJyb3dzZXIgYmVoYXZpb3IgaXMgYSBnb29kIHdheSB0byBpbXByb3ZlIGZlZWwgYW5kIHdvcmtpbmcuXG4gKiBgYGBgXG4gKiAgaGFtbWVydGltZS5vbihcImRyYWdcIiwgZnVuY3Rpb24oZXYpIHtcbiAqICAgIGNvbnNvbGUubG9nKGV2KTtcbiAqICAgIGV2Lmdlc3R1cmUucHJldmVudERlZmF1bHQoKTtcbiAqICB9KTtcbiAqIGBgYGBcbiAqXG4gKiBAY2xhc3MgRHJhZ1xuICogQHN0YXRpY1xuICovXG4vKipcbiAqIEBldmVudCBkcmFnXG4gKiBAcGFyYW0ge09iamVjdH0gZXZcbiAqL1xuLyoqXG4gKiBAZXZlbnQgZHJhZ3N0YXJ0XG4gKiBAcGFyYW0ge09iamVjdH0gZXZcbiAqL1xuLyoqXG4gKiBAZXZlbnQgZHJhZ2VuZFxuICogQHBhcmFtIHtPYmplY3R9IGV2XG4gKi9cbi8qKlxuICogQGV2ZW50IGRyYXBsZWZ0XG4gKiBAcGFyYW0ge09iamVjdH0gZXZcbiAqL1xuLyoqXG4gKiBAZXZlbnQgZHJhZ3JpZ2h0XG4gKiBAcGFyYW0ge09iamVjdH0gZXZcbiAqL1xuLyoqXG4gKiBAZXZlbnQgZHJhZ3VwXG4gKiBAcGFyYW0ge09iamVjdH0gZXZcbiAqL1xuLyoqXG4gKiBAZXZlbnQgZHJhZ2Rvd25cbiAqIEBwYXJhbSB7T2JqZWN0fSBldlxuICovXG5cbi8qKlxuICogQHBhcmFtIHtTdHJpbmd9IG5hbWVcbiAqL1xuKGZ1bmN0aW9uKG5hbWUpIHtcbiAgICB2YXIgdHJpZ2dlcmVkID0gZmFsc2U7XG5cbiAgICBmdW5jdGlvbiBkcmFnR2VzdHVyZShldiwgaW5zdCkge1xuICAgICAgICB2YXIgY3VyID0gRGV0ZWN0aW9uLmN1cnJlbnQ7XG5cbiAgICAgICAgLy8gbWF4IHRvdWNoZXNcbiAgICAgICAgaWYoaW5zdC5vcHRpb25zLmRyYWdNYXhUb3VjaGVzID4gMCAmJlxuICAgICAgICAgICAgZXYudG91Y2hlcy5sZW5ndGggPiBpbnN0Lm9wdGlvbnMuZHJhZ01heFRvdWNoZXMpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHN3aXRjaChldi5ldmVudFR5cGUpIHtcbiAgICAgICAgICAgIGNhc2UgRVZFTlRfU1RBUlQ6XG4gICAgICAgICAgICAgICAgdHJpZ2dlcmVkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgIGNhc2UgRVZFTlRfTU9WRTpcbiAgICAgICAgICAgICAgICAvLyB3aGVuIHRoZSBkaXN0YW5jZSB3ZSBtb3ZlZCBpcyB0b28gc21hbGwgd2Ugc2tpcCB0aGlzIGdlc3R1cmVcbiAgICAgICAgICAgICAgICAvLyBvciB3ZSBjYW4gYmUgYWxyZWFkeSBpbiBkcmFnZ2luZ1xuICAgICAgICAgICAgICAgIGlmKGV2LmRpc3RhbmNlIDwgaW5zdC5vcHRpb25zLmRyYWdNaW5EaXN0YW5jZSAmJlxuICAgICAgICAgICAgICAgICAgICBjdXIubmFtZSAhPSBuYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB2YXIgc3RhcnRDZW50ZXIgPSBjdXIuc3RhcnRFdmVudC5jZW50ZXI7XG5cbiAgICAgICAgICAgICAgICAvLyB3ZSBhcmUgZHJhZ2dpbmchXG4gICAgICAgICAgICAgICAgaWYoY3VyLm5hbWUgIT0gbmFtZSkge1xuICAgICAgICAgICAgICAgICAgICBjdXIubmFtZSA9IG5hbWU7XG4gICAgICAgICAgICAgICAgICAgIGlmKGluc3Qub3B0aW9ucy5kcmFnRGlzdGFuY2VDb3JyZWN0aW9uICYmIGV2LmRpc3RhbmNlID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gV2hlbiBhIGRyYWcgaXMgdHJpZ2dlcmVkLCBzZXQgdGhlIGV2ZW50IGNlbnRlciB0byBkcmFnTWluRGlzdGFuY2UgcGl4ZWxzIGZyb20gdGhlIG9yaWdpbmFsIGV2ZW50IGNlbnRlci5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFdpdGhvdXQgdGhpcyBjb3JyZWN0aW9uLCB0aGUgZHJhZ2dlZCBkaXN0YW5jZSB3b3VsZCBqdW1wc3RhcnQgYXQgZHJhZ01pbkRpc3RhbmNlIHBpeGVscyBpbnN0ZWFkIG9mIGF0IDAuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBJdCBtaWdodCBiZSB1c2VmdWwgdG8gc2F2ZSB0aGUgb3JpZ2luYWwgc3RhcnQgcG9pbnQgc29tZXdoZXJlXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgZmFjdG9yID0gTWF0aC5hYnMoaW5zdC5vcHRpb25zLmRyYWdNaW5EaXN0YW5jZSAvIGV2LmRpc3RhbmNlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0Q2VudGVyLnBhZ2VYICs9IGV2LmRlbHRhWCAqIGZhY3RvcjtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0Q2VudGVyLnBhZ2VZICs9IGV2LmRlbHRhWSAqIGZhY3RvcjtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0Q2VudGVyLmNsaWVudFggKz0gZXYuZGVsdGFYICogZmFjdG9yO1xuICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnRDZW50ZXIuY2xpZW50WSArPSBldi5kZWx0YVkgKiBmYWN0b3I7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHJlY2FsY3VsYXRlIGV2ZW50IGRhdGEgdXNpbmcgbmV3IHN0YXJ0IHBvaW50XG4gICAgICAgICAgICAgICAgICAgICAgICBldiA9IERldGVjdGlvbi5leHRlbmRFdmVudERhdGEoZXYpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gbG9jayBkcmFnIHRvIGF4aXM/XG4gICAgICAgICAgICAgICAgaWYoY3VyLmxhc3RFdmVudC5kcmFnTG9ja1RvQXhpcyB8fFxuICAgICAgICAgICAgICAgICAgICAoIGluc3Qub3B0aW9ucy5kcmFnTG9ja1RvQXhpcyAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgaW5zdC5vcHRpb25zLmRyYWdMb2NrTWluRGlzdGFuY2UgPD0gZXYuZGlzdGFuY2VcbiAgICAgICAgICAgICAgICAgICAgICAgICkpIHtcbiAgICAgICAgICAgICAgICAgICAgZXYuZHJhZ0xvY2tUb0F4aXMgPSB0cnVlO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIGtlZXAgZGlyZWN0aW9uIG9uIHRoZSBheGlzIHRoYXQgdGhlIGRyYWcgZ2VzdHVyZSBzdGFydGVkIG9uXG4gICAgICAgICAgICAgICAgdmFyIGxhc3REaXJlY3Rpb24gPSBjdXIubGFzdEV2ZW50LmRpcmVjdGlvbjtcbiAgICAgICAgICAgICAgICBpZihldi5kcmFnTG9ja1RvQXhpcyAmJiBsYXN0RGlyZWN0aW9uICE9PSBldi5kaXJlY3Rpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgaWYoVXRpbHMuaXNWZXJ0aWNhbChsYXN0RGlyZWN0aW9uKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZXYuZGlyZWN0aW9uID0gKGV2LmRlbHRhWSA8IDApID8gRElSRUNUSU9OX1VQIDogRElSRUNUSU9OX0RPV047XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBldi5kaXJlY3Rpb24gPSAoZXYuZGVsdGFYIDwgMCkgPyBESVJFQ1RJT05fTEVGVCA6IERJUkVDVElPTl9SSUdIVDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIGZpcnN0IHRpbWUsIHRyaWdnZXIgZHJhZ3N0YXJ0IGV2ZW50XG4gICAgICAgICAgICAgICAgaWYoIXRyaWdnZXJlZCkge1xuICAgICAgICAgICAgICAgICAgICBpbnN0LnRyaWdnZXIobmFtZSArICdzdGFydCcsIGV2KTtcbiAgICAgICAgICAgICAgICAgICAgdHJpZ2dlcmVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyB0cmlnZ2VyIGV2ZW50c1xuICAgICAgICAgICAgICAgIGluc3QudHJpZ2dlcihuYW1lLCBldik7XG4gICAgICAgICAgICAgICAgaW5zdC50cmlnZ2VyKG5hbWUgKyBldi5kaXJlY3Rpb24sIGV2KTtcblxuICAgICAgICAgICAgICAgIHZhciBpc1ZlcnRpY2FsID0gVXRpbHMuaXNWZXJ0aWNhbChldi5kaXJlY3Rpb24pO1xuXG4gICAgICAgICAgICAgICAgLy8gYmxvY2sgdGhlIGJyb3dzZXIgZXZlbnRzXG4gICAgICAgICAgICAgICAgaWYoKGluc3Qub3B0aW9ucy5kcmFnQmxvY2tWZXJ0aWNhbCAmJiBpc1ZlcnRpY2FsKSB8fFxuICAgICAgICAgICAgICAgICAgICAoaW5zdC5vcHRpb25zLmRyYWdCbG9ja0hvcml6b250YWwgJiYgIWlzVmVydGljYWwpKSB7XG4gICAgICAgICAgICAgICAgICAgIGV2LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBjYXNlIEVWRU5UX1JFTEVBU0U6XG4gICAgICAgICAgICAgICAgaWYodHJpZ2dlcmVkICYmIGV2LmNoYW5nZWRMZW5ndGggPD0gaW5zdC5vcHRpb25zLmRyYWdNYXhUb3VjaGVzKSB7XG4gICAgICAgICAgICAgICAgICAgIGluc3QudHJpZ2dlcihuYW1lICsgJ2VuZCcsIGV2KTtcbiAgICAgICAgICAgICAgICAgICAgdHJpZ2dlcmVkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBjYXNlIEVWRU5UX0VORDpcbiAgICAgICAgICAgICAgICB0cmlnZ2VyZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgIH1cblxuICAgIEhhbW1lci5nZXN0dXJlcy5EcmFnID0ge1xuICAgICAgICBuYW1lOiBuYW1lLFxuICAgICAgICBpbmRleDogNTAsXG4gICAgICAgIGhhbmRsZXI6IGRyYWdHZXN0dXJlLFxuICAgICAgICBkZWZhdWx0czoge1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBtaW5pbWFsIG1vdmVtZW50IHRoYXQgaGF2ZSB0byBiZSBtYWRlIGJlZm9yZSB0aGUgZHJhZyBldmVudCBnZXRzIHRyaWdnZXJlZFxuICAgICAgICAgICAgICogQHByb3BlcnR5IGRyYWdNaW5EaXN0YW5jZVxuICAgICAgICAgICAgICogQHR5cGUge051bWJlcn1cbiAgICAgICAgICAgICAqIEBkZWZhdWx0IDEwXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGRyYWdNaW5EaXN0YW5jZTogMTAsXG5cbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogU2V0IGRyYWdEaXN0YW5jZUNvcnJlY3Rpb24gdG8gdHJ1ZSB0byBtYWtlIHRoZSBzdGFydGluZyBwb2ludCBvZiB0aGUgZHJhZ1xuICAgICAgICAgICAgICogYmUgY2FsY3VsYXRlZCBmcm9tIHdoZXJlIHRoZSBkcmFnIHdhcyB0cmlnZ2VyZWQsIG5vdCBmcm9tIHdoZXJlIHRoZSB0b3VjaCBzdGFydGVkLlxuICAgICAgICAgICAgICogVXNlZnVsIHRvIGF2b2lkIGEgamVyay1zdGFydGluZyBkcmFnLCB3aGljaCBjYW4gbWFrZSBmaW5lLWFkanVzdG1lbnRzXG4gICAgICAgICAgICAgKiB0aHJvdWdoIGRyYWdnaW5nIGRpZmZpY3VsdCwgYW5kIGJlIHZpc3VhbGx5IHVuYXBwZWFsaW5nLlxuICAgICAgICAgICAgICogQHByb3BlcnR5IGRyYWdEaXN0YW5jZUNvcnJlY3Rpb25cbiAgICAgICAgICAgICAqIEB0eXBlIHtCb29sZWFufVxuICAgICAgICAgICAgICogQGRlZmF1bHQgdHJ1ZVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBkcmFnRGlzdGFuY2VDb3JyZWN0aW9uOiB0cnVlLFxuXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIHNldCAwIGZvciB1bmxpbWl0ZWQsIGJ1dCB0aGlzIGNhbiBjb25mbGljdCB3aXRoIHRyYW5zZm9ybVxuICAgICAgICAgICAgICogQHByb3BlcnR5IGRyYWdNYXhUb3VjaGVzXG4gICAgICAgICAgICAgKiBAdHlwZSB7TnVtYmVyfVxuICAgICAgICAgICAgICogQGRlZmF1bHQgMVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBkcmFnTWF4VG91Y2hlczogMSxcblxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBwcmV2ZW50IGRlZmF1bHQgYnJvd3NlciBiZWhhdmlvciB3aGVuIGRyYWdnaW5nIG9jY3Vyc1xuICAgICAgICAgICAgICogYmUgY2FyZWZ1bCB3aXRoIGl0LCBpdCBtYWtlcyB0aGUgZWxlbWVudCBhIGJsb2NraW5nIGVsZW1lbnRcbiAgICAgICAgICAgICAqIHdoZW4geW91IGFyZSB1c2luZyB0aGUgZHJhZyBnZXN0dXJlLCBpdCBpcyBhIGdvb2QgcHJhY3RpY2UgdG8gc2V0IHRoaXMgdHJ1ZVxuICAgICAgICAgICAgICogQHByb3BlcnR5IGRyYWdCbG9ja0hvcml6b250YWxcbiAgICAgICAgICAgICAqIEB0eXBlIHtCb29sZWFufVxuICAgICAgICAgICAgICogQGRlZmF1bHQgZmFsc2VcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgZHJhZ0Jsb2NrSG9yaXpvbnRhbDogZmFsc2UsXG5cbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogc2FtZSBhcyBgZHJhZ0Jsb2NrSG9yaXpvbnRhbGAsIGJ1dCBmb3IgdmVydGljYWwgbW92ZW1lbnRcbiAgICAgICAgICAgICAqIEBwcm9wZXJ0eSBkcmFnQmxvY2tWZXJ0aWNhbFxuICAgICAgICAgICAgICogQHR5cGUge0Jvb2xlYW59XG4gICAgICAgICAgICAgKiBAZGVmYXVsdCBmYWxzZVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBkcmFnQmxvY2tWZXJ0aWNhbDogZmFsc2UsXG5cbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogZHJhZ0xvY2tUb0F4aXMga2VlcHMgdGhlIGRyYWcgZ2VzdHVyZSBvbiB0aGUgYXhpcyB0aGF0IGl0IHN0YXJ0ZWQgb24sXG4gICAgICAgICAgICAgKiBJdCBkaXNhbGxvd3MgdmVydGljYWwgZGlyZWN0aW9ucyBpZiB0aGUgaW5pdGlhbCBkaXJlY3Rpb24gd2FzIGhvcml6b250YWwsIGFuZCB2aWNlIHZlcnNhLlxuICAgICAgICAgICAgICogQHByb3BlcnR5IGRyYWdMb2NrVG9BeGlzXG4gICAgICAgICAgICAgKiBAdHlwZSB7Qm9vbGVhbn1cbiAgICAgICAgICAgICAqIEBkZWZhdWx0IGZhbHNlXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGRyYWdMb2NrVG9BeGlzOiBmYWxzZSxcblxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBkcmFnIGxvY2sgb25seSBraWNrcyBpbiB3aGVuIGRpc3RhbmNlID4gZHJhZ0xvY2tNaW5EaXN0YW5jZVxuICAgICAgICAgICAgICogVGhpcyB3YXksIGxvY2tpbmcgb2NjdXJzIG9ubHkgd2hlbiB0aGUgZGlzdGFuY2UgaGFzIGJlY29tZSBsYXJnZSBlbm91Z2ggdG8gcmVsaWFibHkgZGV0ZXJtaW5lIHRoZSBkaXJlY3Rpb25cbiAgICAgICAgICAgICAqIEBwcm9wZXJ0eSBkcmFnTG9ja01pbkRpc3RhbmNlXG4gICAgICAgICAgICAgKiBAdHlwZSB7TnVtYmVyfVxuICAgICAgICAgICAgICogQGRlZmF1bHQgMjVcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgZHJhZ0xvY2tNaW5EaXN0YW5jZTogMjVcbiAgICAgICAgfVxuICAgIH07XG59KSgnZHJhZycpO1xuXG4vKipcbiAqIEBtb2R1bGUgZ2VzdHVyZXNcbiAqL1xuLyoqXG4gKiB0cmlnZ2VyIGEgc2ltcGxlIGdlc3R1cmUgZXZlbnQsIHNvIHlvdSBjYW4gZG8gYW55dGhpbmcgaW4geW91ciBoYW5kbGVyLlxuICogb25seSB1c2FibGUgaWYgeW91IGtub3cgd2hhdCB5b3VyIGRvaW5nLi4uXG4gKlxuICogQGNsYXNzIEdlc3R1cmVcbiAqIEBzdGF0aWNcbiAqL1xuLyoqXG4gKiBAZXZlbnQgZ2VzdHVyZVxuICogQHBhcmFtIHtPYmplY3R9IGV2XG4gKi9cbkhhbW1lci5nZXN0dXJlcy5HZXN0dXJlID0ge1xuICAgIG5hbWU6ICdnZXN0dXJlJyxcbiAgICBpbmRleDogMTMzNyxcbiAgICBoYW5kbGVyOiBmdW5jdGlvbiByZWxlYXNlR2VzdHVyZShldiwgaW5zdCkge1xuICAgICAgICBpbnN0LnRyaWdnZXIodGhpcy5uYW1lLCBldik7XG4gICAgfVxufTtcblxuLyoqXG4gKiBAbW9kdWxlIGdlc3R1cmVzXG4gKi9cbi8qKlxuICogVG91Y2ggc3RheXMgYXQgdGhlIHNhbWUgcGxhY2UgZm9yIHggdGltZVxuICpcbiAqIEBjbGFzcyBIb2xkXG4gKiBAc3RhdGljXG4gKi9cbi8qKlxuICogQGV2ZW50IGhvbGRcbiAqIEBwYXJhbSB7T2JqZWN0fSBldlxuICovXG5cbi8qKlxuICogQHBhcmFtIHtTdHJpbmd9IG5hbWVcbiAqL1xuKGZ1bmN0aW9uKG5hbWUpIHtcbiAgICB2YXIgdGltZXI7XG5cbiAgICBmdW5jdGlvbiBob2xkR2VzdHVyZShldiwgaW5zdCkge1xuICAgICAgICB2YXIgb3B0aW9ucyA9IGluc3Qub3B0aW9ucyxcbiAgICAgICAgICAgIGN1cnJlbnQgPSBEZXRlY3Rpb24uY3VycmVudDtcblxuICAgICAgICBzd2l0Y2goZXYuZXZlbnRUeXBlKSB7XG4gICAgICAgICAgICBjYXNlIEVWRU5UX1NUQVJUOlxuICAgICAgICAgICAgICAgIGNsZWFyVGltZW91dCh0aW1lcik7XG5cbiAgICAgICAgICAgICAgICAvLyBzZXQgdGhlIGdlc3R1cmUgc28gd2UgY2FuIGNoZWNrIGluIHRoZSB0aW1lb3V0IGlmIGl0IHN0aWxsIGlzXG4gICAgICAgICAgICAgICAgY3VycmVudC5uYW1lID0gbmFtZTtcblxuICAgICAgICAgICAgICAgIC8vIHNldCB0aW1lciBhbmQgaWYgYWZ0ZXIgdGhlIHRpbWVvdXQgaXQgc3RpbGwgaXMgaG9sZCxcbiAgICAgICAgICAgICAgICAvLyB3ZSB0cmlnZ2VyIHRoZSBob2xkIGV2ZW50XG4gICAgICAgICAgICAgICAgdGltZXIgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICBpZihjdXJyZW50ICYmIGN1cnJlbnQubmFtZSA9PSBuYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpbnN0LnRyaWdnZXIobmFtZSwgZXYpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSwgb3B0aW9ucy5ob2xkVGltZW91dCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgIGNhc2UgRVZFTlRfTU9WRTpcbiAgICAgICAgICAgICAgICBpZihldi5kaXN0YW5jZSA+IG9wdGlvbnMuaG9sZFRocmVzaG9sZCkge1xuICAgICAgICAgICAgICAgICAgICBjbGVhclRpbWVvdXQodGltZXIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgY2FzZSBFVkVOVF9SRUxFQVNFOlxuICAgICAgICAgICAgICAgIGNsZWFyVGltZW91dCh0aW1lcik7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBIYW1tZXIuZ2VzdHVyZXMuSG9sZCA9IHtcbiAgICAgICAgbmFtZTogbmFtZSxcbiAgICAgICAgaW5kZXg6IDEwLFxuICAgICAgICBkZWZhdWx0czoge1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBAcHJvcGVydHkgaG9sZFRpbWVvdXRcbiAgICAgICAgICAgICAqIEB0eXBlIHtOdW1iZXJ9XG4gICAgICAgICAgICAgKiBAZGVmYXVsdCA1MDBcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgaG9sZFRpbWVvdXQ6IDUwMCxcblxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBtb3ZlbWVudCBhbGxvd2VkIHdoaWxlIGhvbGRpbmdcbiAgICAgICAgICAgICAqIEBwcm9wZXJ0eSBob2xkVGhyZXNob2xkXG4gICAgICAgICAgICAgKiBAdHlwZSB7TnVtYmVyfVxuICAgICAgICAgICAgICogQGRlZmF1bHQgMlxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBob2xkVGhyZXNob2xkOiAyXG4gICAgICAgIH0sXG4gICAgICAgIGhhbmRsZXI6IGhvbGRHZXN0dXJlXG4gICAgfTtcbn0pKCdob2xkJyk7XG5cbi8qKlxuICogQG1vZHVsZSBnZXN0dXJlc1xuICovXG4vKipcbiAqIHdoZW4gYSB0b3VjaCBpcyBiZWluZyByZWxlYXNlZCBmcm9tIHRoZSBwYWdlXG4gKlxuICogQGNsYXNzIFJlbGVhc2VcbiAqIEBzdGF0aWNcbiAqL1xuLyoqXG4gKiBAZXZlbnQgcmVsZWFzZVxuICogQHBhcmFtIHtPYmplY3R9IGV2XG4gKi9cbkhhbW1lci5nZXN0dXJlcy5SZWxlYXNlID0ge1xuICAgIG5hbWU6ICdyZWxlYXNlJyxcbiAgICBpbmRleDogSW5maW5pdHksXG4gICAgaGFuZGxlcjogZnVuY3Rpb24gcmVsZWFzZUdlc3R1cmUoZXYsIGluc3QpIHtcbiAgICAgICAgaWYoZXYuZXZlbnRUeXBlID09IEVWRU5UX1JFTEVBU0UpIHtcbiAgICAgICAgICAgIGluc3QudHJpZ2dlcih0aGlzLm5hbWUsIGV2KTtcbiAgICAgICAgfVxuICAgIH1cbn07XG5cbi8qKlxuICogQG1vZHVsZSBnZXN0dXJlc1xuICovXG4vKipcbiAqIHRyaWdnZXJzIHN3aXBlIGV2ZW50cyB3aGVuIHRoZSBlbmQgdmVsb2NpdHkgaXMgYWJvdmUgdGhlIHRocmVzaG9sZFxuICogZm9yIGJlc3QgdXNhZ2UsIHNldCBgcHJldmVudERlZmF1bHRgIChvbiB0aGUgZHJhZyBnZXN0dXJlKSB0byBgdHJ1ZWBcbiAqIGBgYGBcbiAqICBoYW1tZXJ0aW1lLm9uKFwiZHJhZ2xlZnQgc3dpcGVsZWZ0XCIsIGZ1bmN0aW9uKGV2KSB7XG4gKiAgICBjb25zb2xlLmxvZyhldik7XG4gKiAgICBldi5nZXN0dXJlLnByZXZlbnREZWZhdWx0KCk7XG4gKiAgfSk7XG4gKiBgYGBgXG4gKlxuICogQGNsYXNzIFN3aXBlXG4gKiBAc3RhdGljXG4gKi9cbi8qKlxuICogQGV2ZW50IHN3aXBlXG4gKiBAcGFyYW0ge09iamVjdH0gZXZcbiAqL1xuLyoqXG4gKiBAZXZlbnQgc3dpcGVsZWZ0XG4gKiBAcGFyYW0ge09iamVjdH0gZXZcbiAqL1xuLyoqXG4gKiBAZXZlbnQgc3dpcGVyaWdodFxuICogQHBhcmFtIHtPYmplY3R9IGV2XG4gKi9cbi8qKlxuICogQGV2ZW50IHN3aXBldXBcbiAqIEBwYXJhbSB7T2JqZWN0fSBldlxuICovXG4vKipcbiAqIEBldmVudCBzd2lwZWRvd25cbiAqIEBwYXJhbSB7T2JqZWN0fSBldlxuICovXG5IYW1tZXIuZ2VzdHVyZXMuU3dpcGUgPSB7XG4gICAgbmFtZTogJ3N3aXBlJyxcbiAgICBpbmRleDogNDAsXG4gICAgZGVmYXVsdHM6IHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEBwcm9wZXJ0eSBzd2lwZU1pblRvdWNoZXNcbiAgICAgICAgICogQHR5cGUge051bWJlcn1cbiAgICAgICAgICogQGRlZmF1bHQgMVxuICAgICAgICAgKi9cbiAgICAgICAgc3dpcGVNaW5Ub3VjaGVzOiAxLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAcHJvcGVydHkgc3dpcGVNYXhUb3VjaGVzXG4gICAgICAgICAqIEB0eXBlIHtOdW1iZXJ9XG4gICAgICAgICAqIEBkZWZhdWx0IDFcbiAgICAgICAgICovXG4gICAgICAgIHN3aXBlTWF4VG91Y2hlczogMSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogaG9yaXpvbnRhbCBzd2lwZSB2ZWxvY2l0eVxuICAgICAgICAgKiBAcHJvcGVydHkgc3dpcGVWZWxvY2l0eVhcbiAgICAgICAgICogQHR5cGUge051bWJlcn1cbiAgICAgICAgICogQGRlZmF1bHQgMC42XG4gICAgICAgICAqL1xuICAgICAgICBzd2lwZVZlbG9jaXR5WDogMC42LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiB2ZXJ0aWNhbCBzd2lwZSB2ZWxvY2l0eVxuICAgICAgICAgKiBAcHJvcGVydHkgc3dpcGVWZWxvY2l0eVlcbiAgICAgICAgICogQHR5cGUge051bWJlcn1cbiAgICAgICAgICogQGRlZmF1bHQgMC42XG4gICAgICAgICAqL1xuICAgICAgICBzd2lwZVZlbG9jaXR5WTogMC42XG4gICAgfSxcblxuICAgIGhhbmRsZXI6IGZ1bmN0aW9uIHN3aXBlR2VzdHVyZShldiwgaW5zdCkge1xuICAgICAgICBpZihldi5ldmVudFR5cGUgPT0gRVZFTlRfUkVMRUFTRSkge1xuICAgICAgICAgICAgdmFyIHRvdWNoZXMgPSBldi50b3VjaGVzLmxlbmd0aCxcbiAgICAgICAgICAgICAgICBvcHRpb25zID0gaW5zdC5vcHRpb25zO1xuXG4gICAgICAgICAgICAvLyBtYXggdG91Y2hlc1xuICAgICAgICAgICAgaWYodG91Y2hlcyA8IG9wdGlvbnMuc3dpcGVNaW5Ub3VjaGVzIHx8XG4gICAgICAgICAgICAgICAgdG91Y2hlcyA+IG9wdGlvbnMuc3dpcGVNYXhUb3VjaGVzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyB3aGVuIHRoZSBkaXN0YW5jZSB3ZSBtb3ZlZCBpcyB0b28gc21hbGwgd2Ugc2tpcCB0aGlzIGdlc3R1cmVcbiAgICAgICAgICAgIC8vIG9yIHdlIGNhbiBiZSBhbHJlYWR5IGluIGRyYWdnaW5nXG4gICAgICAgICAgICBpZihldi52ZWxvY2l0eVggPiBvcHRpb25zLnN3aXBlVmVsb2NpdHlYIHx8XG4gICAgICAgICAgICAgICAgZXYudmVsb2NpdHlZID4gb3B0aW9ucy5zd2lwZVZlbG9jaXR5WSkge1xuICAgICAgICAgICAgICAgIC8vIHRyaWdnZXIgc3dpcGUgZXZlbnRzXG4gICAgICAgICAgICAgICAgaW5zdC50cmlnZ2VyKHRoaXMubmFtZSwgZXYpO1xuICAgICAgICAgICAgICAgIGluc3QudHJpZ2dlcih0aGlzLm5hbWUgKyBldi5kaXJlY3Rpb24sIGV2KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn07XG5cbi8qKlxuICogQG1vZHVsZSBnZXN0dXJlc1xuICovXG4vKipcbiAqIFNpbmdsZSB0YXAgYW5kIGEgZG91YmxlIHRhcCBvbiBhIHBsYWNlXG4gKlxuICogQGNsYXNzIFRhcFxuICogQHN0YXRpY1xuICovXG4vKipcbiAqIEBldmVudCB0YXBcbiAqIEBwYXJhbSB7T2JqZWN0fSBldlxuICovXG4vKipcbiAqIEBldmVudCBkb3VibGV0YXBcbiAqIEBwYXJhbSB7T2JqZWN0fSBldlxuICovXG5cbi8qKlxuICogQHBhcmFtIHtTdHJpbmd9IG5hbWVcbiAqL1xuKGZ1bmN0aW9uKG5hbWUpIHtcbiAgICB2YXIgaGFzTW92ZWQgPSBmYWxzZTtcblxuICAgIGZ1bmN0aW9uIHRhcEdlc3R1cmUoZXYsIGluc3QpIHtcbiAgICAgICAgdmFyIG9wdGlvbnMgPSBpbnN0Lm9wdGlvbnMsXG4gICAgICAgICAgICBjdXJyZW50ID0gRGV0ZWN0aW9uLmN1cnJlbnQsXG4gICAgICAgICAgICBwcmV2ID0gRGV0ZWN0aW9uLnByZXZpb3VzLFxuICAgICAgICAgICAgc2luY2VQcmV2LFxuICAgICAgICAgICAgZGlkRG91YmxlVGFwO1xuXG4gICAgICAgIHN3aXRjaChldi5ldmVudFR5cGUpIHtcbiAgICAgICAgICAgIGNhc2UgRVZFTlRfU1RBUlQ6XG4gICAgICAgICAgICAgICAgaGFzTW92ZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgY2FzZSBFVkVOVF9NT1ZFOlxuICAgICAgICAgICAgICAgIGhhc01vdmVkID0gaGFzTW92ZWQgfHwgKGV2LmRpc3RhbmNlID4gb3B0aW9ucy50YXBNYXhEaXN0YW5jZSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgIGNhc2UgRVZFTlRfRU5EOlxuICAgICAgICAgICAgICAgIGlmKCFVdGlscy5pblN0cihldi5zcmNFdmVudC50eXBlLCAnY2FuY2VsJykgJiYgZXYuZGVsdGFUaW1lIDwgb3B0aW9ucy50YXBNYXhUaW1lICYmICFoYXNNb3ZlZCkge1xuICAgICAgICAgICAgICAgICAgICAvLyBwcmV2aW91cyBnZXN0dXJlLCBmb3IgdGhlIGRvdWJsZSB0YXAgc2luY2UgdGhlc2UgYXJlIHR3byBkaWZmZXJlbnQgZ2VzdHVyZSBkZXRlY3Rpb25zXG4gICAgICAgICAgICAgICAgICAgIHNpbmNlUHJldiA9IHByZXYgJiYgcHJldi5sYXN0RXZlbnQgJiYgZXYudGltZVN0YW1wIC0gcHJldi5sYXN0RXZlbnQudGltZVN0YW1wO1xuICAgICAgICAgICAgICAgICAgICBkaWREb3VibGVUYXAgPSBmYWxzZTtcblxuICAgICAgICAgICAgICAgICAgICAvLyBjaGVjayBpZiBkb3VibGUgdGFwXG4gICAgICAgICAgICAgICAgICAgIGlmKHByZXYgJiYgcHJldi5uYW1lID09IG5hbWUgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgIChzaW5jZVByZXYgJiYgc2luY2VQcmV2IDwgb3B0aW9ucy5kb3VibGVUYXBJbnRlcnZhbCkgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgIGV2LmRpc3RhbmNlIDwgb3B0aW9ucy5kb3VibGVUYXBEaXN0YW5jZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaW5zdC50cmlnZ2VyKCdkb3VibGV0YXAnLCBldik7XG4gICAgICAgICAgICAgICAgICAgICAgICBkaWREb3VibGVUYXAgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gZG8gYSBzaW5nbGUgdGFwXG4gICAgICAgICAgICAgICAgICAgIGlmKCFkaWREb3VibGVUYXAgfHwgb3B0aW9ucy50YXBBbHdheXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJlbnQubmFtZSA9IG5hbWU7XG4gICAgICAgICAgICAgICAgICAgICAgICBpbnN0LnRyaWdnZXIoY3VycmVudC5uYW1lLCBldik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBIYW1tZXIuZ2VzdHVyZXMuVGFwID0ge1xuICAgICAgICBuYW1lOiBuYW1lLFxuICAgICAgICBpbmRleDogMTAwLFxuICAgICAgICBoYW5kbGVyOiB0YXBHZXN0dXJlLFxuICAgICAgICBkZWZhdWx0czoge1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBtYXggdGltZSBvZiBhIHRhcCwgdGhpcyBpcyBmb3IgdGhlIHNsb3cgdGFwcGVyc1xuICAgICAgICAgICAgICogQHByb3BlcnR5IHRhcE1heFRpbWVcbiAgICAgICAgICAgICAqIEB0eXBlIHtOdW1iZXJ9XG4gICAgICAgICAgICAgKiBAZGVmYXVsdCAyNTBcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgdGFwTWF4VGltZTogMjUwLFxuXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIG1heCBkaXN0YW5jZSBvZiBtb3ZlbWVudCBvZiBhIHRhcCwgdGhpcyBpcyBmb3IgdGhlIHNsb3cgdGFwcGVyc1xuICAgICAgICAgICAgICogQHByb3BlcnR5IHRhcE1heERpc3RhbmNlXG4gICAgICAgICAgICAgKiBAdHlwZSB7TnVtYmVyfVxuICAgICAgICAgICAgICogQGRlZmF1bHQgMTBcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgdGFwTWF4RGlzdGFuY2U6IDEwLFxuXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIGFsd2F5cyB0cmlnZ2VyIHRoZSBgdGFwYCBldmVudCwgZXZlbiB3aGlsZSBkb3VibGUtdGFwcGluZ1xuICAgICAgICAgICAgICogQHByb3BlcnR5IHRhcEFsd2F5c1xuICAgICAgICAgICAgICogQHR5cGUge0Jvb2xlYW59XG4gICAgICAgICAgICAgKiBAZGVmYXVsdCB0cnVlXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIHRhcEFsd2F5czogdHJ1ZSxcblxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBtYXggZGlzdGFuY2UgYmV0d2VlbiB0d28gdGFwc1xuICAgICAgICAgICAgICogQHByb3BlcnR5IGRvdWJsZVRhcERpc3RhbmNlXG4gICAgICAgICAgICAgKiBAdHlwZSB7TnVtYmVyfVxuICAgICAgICAgICAgICogQGRlZmF1bHQgMjBcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgZG91YmxlVGFwRGlzdGFuY2U6IDIwLFxuXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIG1heCB0aW1lIGJldHdlZW4gdHdvIHRhcHNcbiAgICAgICAgICAgICAqIEBwcm9wZXJ0eSBkb3VibGVUYXBJbnRlcnZhbFxuICAgICAgICAgICAgICogQHR5cGUge051bWJlcn1cbiAgICAgICAgICAgICAqIEBkZWZhdWx0IDMwMFxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBkb3VibGVUYXBJbnRlcnZhbDogMzAwXG4gICAgICAgIH1cbiAgICB9O1xufSkoJ3RhcCcpO1xuXG4vKipcbiAqIEBtb2R1bGUgZ2VzdHVyZXNcbiAqL1xuLyoqXG4gKiB3aGVuIGEgdG91Y2ggaXMgYmVpbmcgdG91Y2hlZCBhdCB0aGUgcGFnZVxuICpcbiAqIEBjbGFzcyBUb3VjaFxuICogQHN0YXRpY1xuICovXG4vKipcbiAqIEBldmVudCB0b3VjaFxuICogQHBhcmFtIHtPYmplY3R9IGV2XG4gKi9cbkhhbW1lci5nZXN0dXJlcy5Ub3VjaCA9IHtcbiAgICBuYW1lOiAndG91Y2gnLFxuICAgIGluZGV4OiAtSW5maW5pdHksXG4gICAgZGVmYXVsdHM6IHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIGNhbGwgcHJldmVudERlZmF1bHQgYXQgdG91Y2hzdGFydCwgYW5kIG1ha2VzIHRoZSBlbGVtZW50IGJsb2NraW5nIGJ5IGRpc2FibGluZyB0aGUgc2Nyb2xsaW5nIG9mIHRoZSBwYWdlLFxuICAgICAgICAgKiBidXQgaXQgaW1wcm92ZXMgZ2VzdHVyZXMgbGlrZSB0cmFuc2Zvcm1pbmcgYW5kIGRyYWdnaW5nLlxuICAgICAgICAgKiBiZSBjYXJlZnVsIHdpdGggdXNpbmcgdGhpcywgaXQgY2FuIGJlIHZlcnkgYW5ub3lpbmcgZm9yIHVzZXJzIHRvIGJlIHN0dWNrIG9uIHRoZSBwYWdlXG4gICAgICAgICAqIEBwcm9wZXJ0eSBwcmV2ZW50RGVmYXVsdFxuICAgICAgICAgKiBAdHlwZSB7Qm9vbGVhbn1cbiAgICAgICAgICogQGRlZmF1bHQgZmFsc2VcbiAgICAgICAgICovXG4gICAgICAgIHByZXZlbnREZWZhdWx0OiBmYWxzZSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogZGlzYWJsZSBtb3VzZSBldmVudHMsIHNvIG9ubHkgdG91Y2ggKG9yIHBlbiEpIGlucHV0IHRyaWdnZXJzIGV2ZW50c1xuICAgICAgICAgKiBAcHJvcGVydHkgcHJldmVudE1vdXNlXG4gICAgICAgICAqIEB0eXBlIHtCb29sZWFufVxuICAgICAgICAgKiBAZGVmYXVsdCBmYWxzZVxuICAgICAgICAgKi9cbiAgICAgICAgcHJldmVudE1vdXNlOiBmYWxzZVxuICAgIH0sXG4gICAgaGFuZGxlcjogZnVuY3Rpb24gdG91Y2hHZXN0dXJlKGV2LCBpbnN0KSB7XG4gICAgICAgIGlmKGluc3Qub3B0aW9ucy5wcmV2ZW50TW91c2UgJiYgZXYucG9pbnRlclR5cGUgPT0gUE9JTlRFUl9NT1VTRSkge1xuICAgICAgICAgICAgZXYuc3RvcERldGVjdCgpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYoaW5zdC5vcHRpb25zLnByZXZlbnREZWZhdWx0KSB7XG4gICAgICAgICAgICBldi5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYoZXYuZXZlbnRUeXBlID09IEVWRU5UX1RPVUNIKSB7XG4gICAgICAgICAgICBpbnN0LnRyaWdnZXIoJ3RvdWNoJywgZXYpO1xuICAgICAgICB9XG4gICAgfVxufTtcblxuLyoqXG4gKiBAbW9kdWxlIGdlc3R1cmVzXG4gKi9cbi8qKlxuICogVXNlciB3YW50IHRvIHNjYWxlIG9yIHJvdGF0ZSB3aXRoIDIgZmluZ2Vyc1xuICogUHJldmVudGluZyB0aGUgZGVmYXVsdCBicm93c2VyIGJlaGF2aW9yIGlzIGEgZ29vZCB3YXkgdG8gaW1wcm92ZSBmZWVsIGFuZCB3b3JraW5nLiBUaGlzIGNhbiBiZSBkb25lIHdpdGggdGhlXG4gKiBgcHJldmVudERlZmF1bHRgIG9wdGlvbi5cbiAqXG4gKiBAY2xhc3MgVHJhbnNmb3JtXG4gKiBAc3RhdGljXG4gKi9cbi8qKlxuICogQGV2ZW50IHRyYW5zZm9ybVxuICogQHBhcmFtIHtPYmplY3R9IGV2XG4gKi9cbi8qKlxuICogQGV2ZW50IHRyYW5zZm9ybXN0YXJ0XG4gKiBAcGFyYW0ge09iamVjdH0gZXZcbiAqL1xuLyoqXG4gKiBAZXZlbnQgdHJhbnNmb3JtZW5kXG4gKiBAcGFyYW0ge09iamVjdH0gZXZcbiAqL1xuLyoqXG4gKiBAZXZlbnQgcGluY2hpblxuICogQHBhcmFtIHtPYmplY3R9IGV2XG4gKi9cbi8qKlxuICogQGV2ZW50IHBpbmNob3V0XG4gKiBAcGFyYW0ge09iamVjdH0gZXZcbiAqL1xuLyoqXG4gKiBAZXZlbnQgcm90YXRlXG4gKiBAcGFyYW0ge09iamVjdH0gZXZcbiAqL1xuXG4vKipcbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lXG4gKi9cbihmdW5jdGlvbihuYW1lKSB7XG4gICAgdmFyIHRyaWdnZXJlZCA9IGZhbHNlO1xuXG4gICAgZnVuY3Rpb24gdHJhbnNmb3JtR2VzdHVyZShldiwgaW5zdCkge1xuICAgICAgICBzd2l0Y2goZXYuZXZlbnRUeXBlKSB7XG4gICAgICAgICAgICBjYXNlIEVWRU5UX1NUQVJUOlxuICAgICAgICAgICAgICAgIHRyaWdnZXJlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBjYXNlIEVWRU5UX01PVkU6XG4gICAgICAgICAgICAgICAgLy8gYXQgbGVhc3QgbXVsdGl0b3VjaFxuICAgICAgICAgICAgICAgIGlmKGV2LnRvdWNoZXMubGVuZ3RoIDwgMikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdmFyIHNjYWxlVGhyZXNob2xkID0gTWF0aC5hYnMoMSAtIGV2LnNjYWxlKTtcbiAgICAgICAgICAgICAgICB2YXIgcm90YXRpb25UaHJlc2hvbGQgPSBNYXRoLmFicyhldi5yb3RhdGlvbik7XG5cbiAgICAgICAgICAgICAgICAvLyB3aGVuIHRoZSBkaXN0YW5jZSB3ZSBtb3ZlZCBpcyB0b28gc21hbGwgd2Ugc2tpcCB0aGlzIGdlc3R1cmVcbiAgICAgICAgICAgICAgICAvLyBvciB3ZSBjYW4gYmUgYWxyZWFkeSBpbiBkcmFnZ2luZ1xuICAgICAgICAgICAgICAgIGlmKHNjYWxlVGhyZXNob2xkIDwgaW5zdC5vcHRpb25zLnRyYW5zZm9ybU1pblNjYWxlICYmXG4gICAgICAgICAgICAgICAgICAgIHJvdGF0aW9uVGhyZXNob2xkIDwgaW5zdC5vcHRpb25zLnRyYW5zZm9ybU1pblJvdGF0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyB3ZSBhcmUgdHJhbnNmb3JtaW5nIVxuICAgICAgICAgICAgICAgIERldGVjdGlvbi5jdXJyZW50Lm5hbWUgPSBuYW1lO1xuXG4gICAgICAgICAgICAgICAgLy8gZmlyc3QgdGltZSwgdHJpZ2dlciBkcmFnc3RhcnQgZXZlbnRcbiAgICAgICAgICAgICAgICBpZighdHJpZ2dlcmVkKSB7XG4gICAgICAgICAgICAgICAgICAgIGluc3QudHJpZ2dlcihuYW1lICsgJ3N0YXJ0JywgZXYpO1xuICAgICAgICAgICAgICAgICAgICB0cmlnZ2VyZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGluc3QudHJpZ2dlcihuYW1lLCBldik7IC8vIGJhc2ljIHRyYW5zZm9ybSBldmVudFxuXG4gICAgICAgICAgICAgICAgLy8gdHJpZ2dlciByb3RhdGUgZXZlbnRcbiAgICAgICAgICAgICAgICBpZihyb3RhdGlvblRocmVzaG9sZCA+IGluc3Qub3B0aW9ucy50cmFuc2Zvcm1NaW5Sb3RhdGlvbikge1xuICAgICAgICAgICAgICAgICAgICBpbnN0LnRyaWdnZXIoJ3JvdGF0ZScsIGV2KTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyB0cmlnZ2VyIHBpbmNoIGV2ZW50XG4gICAgICAgICAgICAgICAgaWYoc2NhbGVUaHJlc2hvbGQgPiBpbnN0Lm9wdGlvbnMudHJhbnNmb3JtTWluU2NhbGUpIHtcbiAgICAgICAgICAgICAgICAgICAgaW5zdC50cmlnZ2VyKCdwaW5jaCcsIGV2KTtcbiAgICAgICAgICAgICAgICAgICAgaW5zdC50cmlnZ2VyKCdwaW5jaCcgKyAoZXYuc2NhbGUgPCAxID8gJ2luJyA6ICdvdXQnKSwgZXYpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgY2FzZSBFVkVOVF9SRUxFQVNFOlxuICAgICAgICAgICAgICAgIGlmKHRyaWdnZXJlZCAmJiBldi5jaGFuZ2VkTGVuZ3RoIDwgMikge1xuICAgICAgICAgICAgICAgICAgICBpbnN0LnRyaWdnZXIobmFtZSArICdlbmQnLCBldik7XG4gICAgICAgICAgICAgICAgICAgIHRyaWdnZXJlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgIH1cblxuICAgIEhhbW1lci5nZXN0dXJlcy5UcmFuc2Zvcm0gPSB7XG4gICAgICAgIG5hbWU6IG5hbWUsXG4gICAgICAgIGluZGV4OiA0NSxcbiAgICAgICAgZGVmYXVsdHM6IHtcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogbWluaW1hbCBzY2FsZSBmYWN0b3IsIG5vIHNjYWxlIGlzIDEsIHpvb21pbiBpcyB0byAwIGFuZCB6b29tb3V0IHVudGlsIGhpZ2hlciB0aGVuIDFcbiAgICAgICAgICAgICAqIEBwcm9wZXJ0eSB0cmFuc2Zvcm1NaW5TY2FsZVxuICAgICAgICAgICAgICogQHR5cGUge051bWJlcn1cbiAgICAgICAgICAgICAqIEBkZWZhdWx0IDAuMDFcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgdHJhbnNmb3JtTWluU2NhbGU6IDAuMDEsXG5cbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogcm90YXRpb24gaW4gZGVncmVlc1xuICAgICAgICAgICAgICogQHByb3BlcnR5IHRyYW5zZm9ybU1pblJvdGF0aW9uXG4gICAgICAgICAgICAgKiBAdHlwZSB7TnVtYmVyfVxuICAgICAgICAgICAgICogQGRlZmF1bHQgMVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICB0cmFuc2Zvcm1NaW5Sb3RhdGlvbjogMVxuICAgICAgICB9LFxuXG4gICAgICAgIGhhbmRsZXI6IHRyYW5zZm9ybUdlc3R1cmVcbiAgICB9O1xufSkoJ3RyYW5zZm9ybScpO1xuXG4vKipcbiAqIEBtb2R1bGUgaGFtbWVyXG4gKi9cblxuLy8gQU1EIGV4cG9ydFxuaWYodHlwZW9mIGRlZmluZSA9PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcbiAgICBkZWZpbmUoZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBIYW1tZXI7XG4gICAgfSk7XG4vLyBjb21tb25qcyBleHBvcnRcbn0gZWxzZSBpZih0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cykge1xuICAgIG1vZHVsZS5leHBvcnRzID0gSGFtbWVyO1xuLy8gYnJvd3NlciBleHBvcnRcbn0gZWxzZSB7XG4gICAgd2luZG93LkhhbW1lciA9IEhhbW1lcjtcbn1cblxufSkod2luZG93KTsiLCJyZXF1aXJlKFwiLi90d2Vlbm1heDMvVHdlZW5MaXRlLm1pbi5qc1wiKTtcbnJlcXVpcmUoXCIuL3R3ZWVubWF4My9UaW1lbGluZUxpdGUubWluLmpzXCIpO1xucmVxdWlyZShcIi4vdHdlZW5tYXgzL2Vhc2luZy9FYXNlUGFjay5taW4uanNcIik7XG5yZXF1aXJlKFwiLi90d2Vlbm1heDMvcGx1Z2lucy9DU1NQbHVnaW4ubWluLmpzXCIpO1xucmVxdWlyZShcIi4vdHdlZW5tYXgzL3BsdWdpbnMvU2Nyb2xsVG9QbHVnaW4ubWluLmpzXCIpOyIsIi8qIVxuICogVkVSU0lPTjogMS4xMS4wXG4gKiBEQVRFOiAyMDEzLTEwLTIxXG4gKiBVUERBVEVTIEFORCBET0NTIEFUOiBodHRwOi8vd3d3LmdyZWVuc29jay5jb21cbiAqXG4gKiBAbGljZW5zZSBDb3B5cmlnaHQgKGMpIDIwMDgtMjAxMywgR3JlZW5Tb2NrLiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICogVGhpcyB3b3JrIGlzIHN1YmplY3QgdG8gdGhlIHRlcm1zIGF0IGh0dHA6Ly93d3cuZ3JlZW5zb2NrLmNvbS90ZXJtc19vZl91c2UuaHRtbCBvciBmb3JcbiAqIENsdWIgR3JlZW5Tb2NrIG1lbWJlcnMsIHRoZSBzb2Z0d2FyZSBhZ3JlZW1lbnQgdGhhdCB3YXMgaXNzdWVkIHdpdGggeW91ciBtZW1iZXJzaGlwLlxuICogXG4gKiBAYXV0aG9yOiBKYWNrIERveWxlLCBqYWNrQGdyZWVuc29jay5jb21cbiAqL1xuKHdpbmRvdy5fZ3NRdWV1ZSB8fCAod2luZG93Ll9nc1F1ZXVlID0gW10pKS5wdXNoKGZ1bmN0aW9uICgpIHtcbiAgICBcInVzZSBzdHJpY3RcIjtcbiAgICB3aW5kb3cuX2dzRGVmaW5lKFwiVGltZWxpbmVMaXRlXCIsIFtcImNvcmUuQW5pbWF0aW9uXCIsIFwiY29yZS5TaW1wbGVUaW1lbGluZVwiLCBcIlR3ZWVuTGl0ZVwiXSwgZnVuY3Rpb24gKHQsIGUsIGkpIHtcbiAgICAgICAgdmFyIHMgPSBmdW5jdGlvbiAodCkge1xuICAgICAgICAgICAgZS5jYWxsKHRoaXMsIHQpLCB0aGlzLl9sYWJlbHMgPSB7fSwgdGhpcy5hdXRvUmVtb3ZlQ2hpbGRyZW4gPSB0aGlzLnZhcnMuYXV0b1JlbW92ZUNoaWxkcmVuID09PSAhMCwgdGhpcy5zbW9vdGhDaGlsZFRpbWluZyA9IHRoaXMudmFycy5zbW9vdGhDaGlsZFRpbWluZyA9PT0gITAsIHRoaXMuX3NvcnRDaGlsZHJlbiA9ICEwLCB0aGlzLl9vblVwZGF0ZSA9IHRoaXMudmFycy5vblVwZGF0ZTtcbiAgICAgICAgICAgIHZhciBpLCBzLCByID0gdGhpcy52YXJzO1xuICAgICAgICAgICAgZm9yIChzIGluIHIpaSA9IHJbc10sIGEoaSkgJiYgLTEgIT09IGkuam9pbihcIlwiKS5pbmRleE9mKFwie3NlbGZ9XCIpICYmIChyW3NdID0gdGhpcy5fc3dhcFNlbGZJblBhcmFtcyhpKSk7XG4gICAgICAgICAgICBhKHIudHdlZW5zKSAmJiB0aGlzLmFkZChyLnR3ZWVucywgMCwgci5hbGlnbiwgci5zdGFnZ2VyKVxuICAgICAgICB9LCByID0gMWUtMTAsIG4gPSBpLl9pbnRlcm5hbHMuaXNTZWxlY3RvciwgYSA9IGkuX2ludGVybmFscy5pc0FycmF5LCBvID0gW10sIGggPSBmdW5jdGlvbiAodCkge1xuICAgICAgICAgICAgdmFyIGUsIGkgPSB7fTtcbiAgICAgICAgICAgIGZvciAoZSBpbiB0KWlbZV0gPSB0W2VdO1xuICAgICAgICAgICAgcmV0dXJuIGlcbiAgICAgICAgfSwgbCA9IGZ1bmN0aW9uICh0LCBlLCBpLCBzKSB7XG4gICAgICAgICAgICB0Ll90aW1lbGluZS5wYXVzZSh0Ll9zdGFydFRpbWUpLCBlICYmIGUuYXBwbHkocyB8fCB0Ll90aW1lbGluZSwgaSB8fCBvKVxuICAgICAgICB9LCBfID0gby5zbGljZSwgdSA9IHMucHJvdG90eXBlID0gbmV3IGU7XG4gICAgICAgIHJldHVybiBzLnZlcnNpb24gPSBcIjEuMTEuMFwiLCB1LmNvbnN0cnVjdG9yID0gcywgdS5raWxsKCkuX2djID0gITEsIHUudG8gPSBmdW5jdGlvbiAodCwgZSwgcywgcikge1xuICAgICAgICAgICAgcmV0dXJuIGUgPyB0aGlzLmFkZChuZXcgaSh0LCBlLCBzKSwgcikgOiB0aGlzLnNldCh0LCBzLCByKVxuICAgICAgICB9LCB1LmZyb20gPSBmdW5jdGlvbiAodCwgZSwgcywgcikge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuYWRkKGkuZnJvbSh0LCBlLCBzKSwgcilcbiAgICAgICAgfSwgdS5mcm9tVG8gPSBmdW5jdGlvbiAodCwgZSwgcywgciwgbikge1xuICAgICAgICAgICAgcmV0dXJuIGUgPyB0aGlzLmFkZChpLmZyb21Ubyh0LCBlLCBzLCByKSwgbikgOiB0aGlzLnNldCh0LCByLCBuKVxuICAgICAgICB9LCB1LnN0YWdnZXJUbyA9IGZ1bmN0aW9uICh0LCBlLCByLCBhLCBvLCBsLCB1LCBwKSB7XG4gICAgICAgICAgICB2YXIgZiwgYyA9IG5ldyBzKHtvbkNvbXBsZXRlOiBsLCBvbkNvbXBsZXRlUGFyYW1zOiB1LCBvbkNvbXBsZXRlU2NvcGU6IHB9KTtcbiAgICAgICAgICAgIGZvciAoXCJzdHJpbmdcIiA9PSB0eXBlb2YgdCAmJiAodCA9IGkuc2VsZWN0b3IodCkgfHwgdCksIG4odCkgJiYgKHQgPSBfLmNhbGwodCwgMCkpLCBhID0gYSB8fCAwLCBmID0gMDsgdC5sZW5ndGggPiBmOyBmKyspci5zdGFydEF0ICYmIChyLnN0YXJ0QXQgPSBoKHIuc3RhcnRBdCkpLCBjLnRvKHRbZl0sIGUsIGgociksIGYgKiBhKTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmFkZChjLCBvKVxuICAgICAgICB9LCB1LnN0YWdnZXJGcm9tID0gZnVuY3Rpb24gKHQsIGUsIGksIHMsIHIsIG4sIGEsIG8pIHtcbiAgICAgICAgICAgIHJldHVybiBpLmltbWVkaWF0ZVJlbmRlciA9IDAgIT0gaS5pbW1lZGlhdGVSZW5kZXIsIGkucnVuQmFja3dhcmRzID0gITAsIHRoaXMuc3RhZ2dlclRvKHQsIGUsIGksIHMsIHIsIG4sIGEsIG8pXG4gICAgICAgIH0sIHUuc3RhZ2dlckZyb21UbyA9IGZ1bmN0aW9uICh0LCBlLCBpLCBzLCByLCBuLCBhLCBvLCBoKSB7XG4gICAgICAgICAgICByZXR1cm4gcy5zdGFydEF0ID0gaSwgcy5pbW1lZGlhdGVSZW5kZXIgPSAwICE9IHMuaW1tZWRpYXRlUmVuZGVyICYmIDAgIT0gaS5pbW1lZGlhdGVSZW5kZXIsIHRoaXMuc3RhZ2dlclRvKHQsIGUsIHMsIHIsIG4sIGEsIG8sIGgpXG4gICAgICAgIH0sIHUuY2FsbCA9IGZ1bmN0aW9uICh0LCBlLCBzLCByKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5hZGQoaS5kZWxheWVkQ2FsbCgwLCB0LCBlLCBzKSwgcilcbiAgICAgICAgfSwgdS5zZXQgPSBmdW5jdGlvbiAodCwgZSwgcykge1xuICAgICAgICAgICAgcmV0dXJuIHMgPSB0aGlzLl9wYXJzZVRpbWVPckxhYmVsKHMsIDAsICEwKSwgbnVsbCA9PSBlLmltbWVkaWF0ZVJlbmRlciAmJiAoZS5pbW1lZGlhdGVSZW5kZXIgPSBzID09PSB0aGlzLl90aW1lICYmICF0aGlzLl9wYXVzZWQpLCB0aGlzLmFkZChuZXcgaSh0LCAwLCBlKSwgcylcbiAgICAgICAgfSwgcy5leHBvcnRSb290ID0gZnVuY3Rpb24gKHQsIGUpIHtcbiAgICAgICAgICAgIHQgPSB0IHx8IHt9LCBudWxsID09IHQuc21vb3RoQ2hpbGRUaW1pbmcgJiYgKHQuc21vb3RoQ2hpbGRUaW1pbmcgPSAhMCk7XG4gICAgICAgICAgICB2YXIgciwgbiwgYSA9IG5ldyBzKHQpLCBvID0gYS5fdGltZWxpbmU7XG4gICAgICAgICAgICBmb3IgKG51bGwgPT0gZSAmJiAoZSA9ICEwKSwgby5fcmVtb3ZlKGEsICEwKSwgYS5fc3RhcnRUaW1lID0gMCwgYS5fcmF3UHJldlRpbWUgPSBhLl90aW1lID0gYS5fdG90YWxUaW1lID0gby5fdGltZSwgciA9IG8uX2ZpcnN0OyByOyluID0gci5fbmV4dCwgZSAmJiByIGluc3RhbmNlb2YgaSAmJiByLnRhcmdldCA9PT0gci52YXJzLm9uQ29tcGxldGUgfHwgYS5hZGQociwgci5fc3RhcnRUaW1lIC0gci5fZGVsYXkpLCByID0gbjtcbiAgICAgICAgICAgIHJldHVybiBvLmFkZChhLCAwKSwgYVxuICAgICAgICB9LCB1LmFkZCA9IGZ1bmN0aW9uIChyLCBuLCBvLCBoKSB7XG4gICAgICAgICAgICB2YXIgbCwgXywgdSwgcCwgZiwgYztcbiAgICAgICAgICAgIGlmIChcIm51bWJlclwiICE9IHR5cGVvZiBuICYmIChuID0gdGhpcy5fcGFyc2VUaW1lT3JMYWJlbChuLCAwLCAhMCwgcikpLCAhKHIgaW5zdGFuY2VvZiB0KSkge1xuICAgICAgICAgICAgICAgIGlmIChyIGluc3RhbmNlb2YgQXJyYXkgfHwgciAmJiByLnB1c2ggJiYgYShyKSkge1xuICAgICAgICAgICAgICAgICAgICBmb3IgKG8gPSBvIHx8IFwibm9ybWFsXCIsIGggPSBoIHx8IDAsIGwgPSBuLCBfID0gci5sZW5ndGgsIHUgPSAwOyBfID4gdTsgdSsrKWEocCA9IHJbdV0pICYmIChwID0gbmV3IHMoe3R3ZWVuczogcH0pKSwgdGhpcy5hZGQocCwgbCksIFwic3RyaW5nXCIgIT0gdHlwZW9mIHAgJiYgXCJmdW5jdGlvblwiICE9IHR5cGVvZiBwICYmIChcInNlcXVlbmNlXCIgPT09IG8gPyBsID0gcC5fc3RhcnRUaW1lICsgcC50b3RhbER1cmF0aW9uKCkgLyBwLl90aW1lU2NhbGUgOiBcInN0YXJ0XCIgPT09IG8gJiYgKHAuX3N0YXJ0VGltZSAtPSBwLmRlbGF5KCkpKSwgbCArPSBoO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fdW5jYWNoZSghMClcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKFwic3RyaW5nXCIgPT0gdHlwZW9mIHIpcmV0dXJuIHRoaXMuYWRkTGFiZWwociwgbik7XG4gICAgICAgICAgICAgICAgaWYgKFwiZnVuY3Rpb25cIiAhPSB0eXBlb2Ygcil0aHJvd1wiQ2Fubm90IGFkZCBcIiArIHIgKyBcIiBpbnRvIHRoZSB0aW1lbGluZTsgaXQgaXMgbm90IGEgdHdlZW4sIHRpbWVsaW5lLCBmdW5jdGlvbiwgb3Igc3RyaW5nLlwiO1xuICAgICAgICAgICAgICAgIHIgPSBpLmRlbGF5ZWRDYWxsKDAsIHIpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZS5wcm90b3R5cGUuYWRkLmNhbGwodGhpcywgciwgbiksIHRoaXMuX2djICYmICF0aGlzLl9wYXVzZWQgJiYgdGhpcy5fZHVyYXRpb24gPCB0aGlzLmR1cmF0aW9uKCkpZm9yIChmID0gdGhpcywgYyA9IGYucmF3VGltZSgpID4gci5fc3RhcnRUaW1lOyBmLl9nYyAmJiBmLl90aW1lbGluZTspZi5fdGltZWxpbmUuc21vb3RoQ2hpbGRUaW1pbmcgJiYgYyA/IGYudG90YWxUaW1lKGYuX3RvdGFsVGltZSwgITApIDogZi5fZW5hYmxlZCghMCwgITEpLCBmID0gZi5fdGltZWxpbmU7XG4gICAgICAgICAgICByZXR1cm4gdGhpc1xuICAgICAgICB9LCB1LnJlbW92ZSA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICBpZiAoZSBpbnN0YW5jZW9mIHQpcmV0dXJuIHRoaXMuX3JlbW92ZShlLCAhMSk7XG4gICAgICAgICAgICBpZiAoZSBpbnN0YW5jZW9mIEFycmF5IHx8IGUgJiYgZS5wdXNoICYmIGEoZSkpIHtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gZS5sZW5ndGg7IC0taSA+IC0xOyl0aGlzLnJlbW92ZShlW2ldKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpc1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuXCJzdHJpbmdcIiA9PSB0eXBlb2YgZSA/IHRoaXMucmVtb3ZlTGFiZWwoZSkgOiB0aGlzLmtpbGwobnVsbCwgZSlcbiAgICAgICAgfSwgdS5fcmVtb3ZlID0gZnVuY3Rpb24gKHQsIGkpIHtcbiAgICAgICAgICAgIGUucHJvdG90eXBlLl9yZW1vdmUuY2FsbCh0aGlzLCB0LCBpKTtcbiAgICAgICAgICAgIHZhciBzID0gdGhpcy5fbGFzdDtcbiAgICAgICAgICAgIHJldHVybiBzID8gdGhpcy5fdGltZSA+IHMuX3N0YXJ0VGltZSArIHMuX3RvdGFsRHVyYXRpb24gLyBzLl90aW1lU2NhbGUgJiYgKHRoaXMuX3RpbWUgPSB0aGlzLmR1cmF0aW9uKCksIHRoaXMuX3RvdGFsVGltZSA9IHRoaXMuX3RvdGFsRHVyYXRpb24pIDogdGhpcy5fdGltZSA9IHRoaXMuX3RvdGFsVGltZSA9IDAsIHRoaXNcbiAgICAgICAgfSwgdS5hcHBlbmQgPSBmdW5jdGlvbiAodCwgZSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuYWRkKHQsIHRoaXMuX3BhcnNlVGltZU9yTGFiZWwobnVsbCwgZSwgITAsIHQpKVxuICAgICAgICB9LCB1Lmluc2VydCA9IHUuaW5zZXJ0TXVsdGlwbGUgPSBmdW5jdGlvbiAodCwgZSwgaSwgcykge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuYWRkKHQsIGUgfHwgMCwgaSwgcylcbiAgICAgICAgfSwgdS5hcHBlbmRNdWx0aXBsZSA9IGZ1bmN0aW9uICh0LCBlLCBpLCBzKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5hZGQodCwgdGhpcy5fcGFyc2VUaW1lT3JMYWJlbChudWxsLCBlLCAhMCwgdCksIGksIHMpXG4gICAgICAgIH0sIHUuYWRkTGFiZWwgPSBmdW5jdGlvbiAodCwgZSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2xhYmVsc1t0XSA9IHRoaXMuX3BhcnNlVGltZU9yTGFiZWwoZSksIHRoaXNcbiAgICAgICAgfSwgdS5hZGRQYXVzZSA9IGZ1bmN0aW9uICh0LCBlLCBpLCBzKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5jYWxsKGwsIFtcIntzZWxmfVwiLCBlLCBpLCBzXSwgdGhpcywgdClcbiAgICAgICAgfSwgdS5yZW1vdmVMYWJlbCA9IGZ1bmN0aW9uICh0KSB7XG4gICAgICAgICAgICByZXR1cm4gZGVsZXRlIHRoaXMuX2xhYmVsc1t0XSwgdGhpc1xuICAgICAgICB9LCB1LmdldExhYmVsVGltZSA9IGZ1bmN0aW9uICh0KSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbCAhPSB0aGlzLl9sYWJlbHNbdF0gPyB0aGlzLl9sYWJlbHNbdF0gOiAtMVxuICAgICAgICB9LCB1Ll9wYXJzZVRpbWVPckxhYmVsID0gZnVuY3Rpb24gKGUsIGksIHMsIHIpIHtcbiAgICAgICAgICAgIHZhciBuO1xuICAgICAgICAgICAgaWYgKHIgaW5zdGFuY2VvZiB0ICYmIHIudGltZWxpbmUgPT09IHRoaXMpdGhpcy5yZW1vdmUocik7IGVsc2UgaWYgKHIgJiYgKHIgaW5zdGFuY2VvZiBBcnJheSB8fCByLnB1c2ggJiYgYShyKSkpZm9yIChuID0gci5sZW5ndGg7IC0tbiA+IC0xOylyW25daW5zdGFuY2VvZiB0ICYmIHJbbl0udGltZWxpbmUgPT09IHRoaXMgJiYgdGhpcy5yZW1vdmUocltuXSk7XG4gICAgICAgICAgICBpZiAoXCJzdHJpbmdcIiA9PSB0eXBlb2YgaSlyZXR1cm4gdGhpcy5fcGFyc2VUaW1lT3JMYWJlbChpLCBzICYmIFwibnVtYmVyXCIgPT0gdHlwZW9mIGUgJiYgbnVsbCA9PSB0aGlzLl9sYWJlbHNbaV0gPyBlIC0gdGhpcy5kdXJhdGlvbigpIDogMCwgcyk7XG4gICAgICAgICAgICBpZiAoaSA9IGkgfHwgMCwgXCJzdHJpbmdcIiAhPSB0eXBlb2YgZSB8fCAhaXNOYU4oZSkgJiYgbnVsbCA9PSB0aGlzLl9sYWJlbHNbZV0pbnVsbCA9PSBlICYmIChlID0gdGhpcy5kdXJhdGlvbigpKTsgZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKG4gPSBlLmluZGV4T2YoXCI9XCIpLCAtMSA9PT0gbilyZXR1cm4gbnVsbCA9PSB0aGlzLl9sYWJlbHNbZV0gPyBzID8gdGhpcy5fbGFiZWxzW2VdID0gdGhpcy5kdXJhdGlvbigpICsgaSA6IGkgOiB0aGlzLl9sYWJlbHNbZV0gKyBpO1xuICAgICAgICAgICAgICAgIGkgPSBwYXJzZUludChlLmNoYXJBdChuIC0gMSkgKyBcIjFcIiwgMTApICogTnVtYmVyKGUuc3Vic3RyKG4gKyAxKSksIGUgPSBuID4gMSA/IHRoaXMuX3BhcnNlVGltZU9yTGFiZWwoZS5zdWJzdHIoMCwgbiAtIDEpLCAwLCBzKSA6IHRoaXMuZHVyYXRpb24oKVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIE51bWJlcihlKSArIGlcbiAgICAgICAgfSwgdS5zZWVrID0gZnVuY3Rpb24gKHQsIGUpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnRvdGFsVGltZShcIm51bWJlclwiID09IHR5cGVvZiB0ID8gdCA6IHRoaXMuX3BhcnNlVGltZU9yTGFiZWwodCksIGUgIT09ICExKVxuICAgICAgICB9LCB1LnN0b3AgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5wYXVzZWQoITApXG4gICAgICAgIH0sIHUuZ290b0FuZFBsYXkgPSBmdW5jdGlvbiAodCwgZSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMucGxheSh0LCBlKVxuICAgICAgICB9LCB1LmdvdG9BbmRTdG9wID0gZnVuY3Rpb24gKHQsIGUpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnBhdXNlKHQsIGUpXG4gICAgICAgIH0sIHUucmVuZGVyID0gZnVuY3Rpb24gKHQsIGUsIGkpIHtcbiAgICAgICAgICAgIHRoaXMuX2djICYmIHRoaXMuX2VuYWJsZWQoITAsICExKTtcbiAgICAgICAgICAgIHZhciBzLCBuLCBhLCBoLCBsLCBfID0gdGhpcy5fZGlydHkgPyB0aGlzLnRvdGFsRHVyYXRpb24oKSA6IHRoaXMuX3RvdGFsRHVyYXRpb24sIHUgPSB0aGlzLl90aW1lLCBwID0gdGhpcy5fc3RhcnRUaW1lLCBmID0gdGhpcy5fdGltZVNjYWxlLCBjID0gdGhpcy5fcGF1c2VkO1xuICAgICAgICAgICAgaWYgKHQgPj0gXyA/ICh0aGlzLl90b3RhbFRpbWUgPSB0aGlzLl90aW1lID0gXywgdGhpcy5fcmV2ZXJzZWQgfHwgdGhpcy5faGFzUGF1c2VkQ2hpbGQoKSB8fCAobiA9ICEwLCBoID0gXCJvbkNvbXBsZXRlXCIsIDAgPT09IHRoaXMuX2R1cmF0aW9uICYmICgwID09PSB0IHx8IDAgPiB0aGlzLl9yYXdQcmV2VGltZSB8fCB0aGlzLl9yYXdQcmV2VGltZSA9PT0gcikgJiYgdGhpcy5fcmF3UHJldlRpbWUgIT09IHQgJiYgdGhpcy5fZmlyc3QgJiYgKGwgPSAhMCwgdGhpcy5fcmF3UHJldlRpbWUgPiByICYmIChoID0gXCJvblJldmVyc2VDb21wbGV0ZVwiKSkpLCB0aGlzLl9yYXdQcmV2VGltZSA9IHRoaXMuX2R1cmF0aW9uIHx8ICFlIHx8IHQgPyB0IDogciwgdCA9IF8gKyAxZS02KSA6IDFlLTcgPiB0ID8gKHRoaXMuX3RvdGFsVGltZSA9IHRoaXMuX3RpbWUgPSAwLCAoMCAhPT0gdSB8fCAwID09PSB0aGlzLl9kdXJhdGlvbiAmJiAodGhpcy5fcmF3UHJldlRpbWUgPiByIHx8IDAgPiB0ICYmIHRoaXMuX3Jhd1ByZXZUaW1lID49IDApKSAmJiAoaCA9IFwib25SZXZlcnNlQ29tcGxldGVcIiwgbiA9IHRoaXMuX3JldmVyc2VkKSwgMCA+IHQgPyAodGhpcy5fYWN0aXZlID0gITEsIDAgPT09IHRoaXMuX2R1cmF0aW9uICYmIHRoaXMuX3Jhd1ByZXZUaW1lID49IDAgJiYgdGhpcy5fZmlyc3QgJiYgKGwgPSAhMCksIHRoaXMuX3Jhd1ByZXZUaW1lID0gdCkgOiAodGhpcy5fcmF3UHJldlRpbWUgPSB0aGlzLl9kdXJhdGlvbiB8fCAhZSB8fCB0ID8gdCA6IHIsIHQgPSAwLCB0aGlzLl9pbml0dGVkIHx8IChsID0gITApKSkgOiB0aGlzLl90b3RhbFRpbWUgPSB0aGlzLl90aW1lID0gdGhpcy5fcmF3UHJldlRpbWUgPSB0LCB0aGlzLl90aW1lICE9PSB1ICYmIHRoaXMuX2ZpcnN0IHx8IGkgfHwgbCkge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLl9pbml0dGVkIHx8ICh0aGlzLl9pbml0dGVkID0gITApLCB0aGlzLl9hY3RpdmUgfHwgIXRoaXMuX3BhdXNlZCAmJiB0aGlzLl90aW1lICE9PSB1ICYmIHQgPiAwICYmICh0aGlzLl9hY3RpdmUgPSAhMCksIDAgPT09IHUgJiYgdGhpcy52YXJzLm9uU3RhcnQgJiYgMCAhPT0gdGhpcy5fdGltZSAmJiAoZSB8fCB0aGlzLnZhcnMub25TdGFydC5hcHBseSh0aGlzLnZhcnMub25TdGFydFNjb3BlIHx8IHRoaXMsIHRoaXMudmFycy5vblN0YXJ0UGFyYW1zIHx8IG8pKSwgdGhpcy5fdGltZSA+PSB1KWZvciAocyA9IHRoaXMuX2ZpcnN0OyBzICYmIChhID0gcy5fbmV4dCwgIXRoaXMuX3BhdXNlZCB8fCBjKTspKHMuX2FjdGl2ZSB8fCBzLl9zdGFydFRpbWUgPD0gdGhpcy5fdGltZSAmJiAhcy5fcGF1c2VkICYmICFzLl9nYykgJiYgKHMuX3JldmVyc2VkID8gcy5yZW5kZXIoKHMuX2RpcnR5ID8gcy50b3RhbER1cmF0aW9uKCkgOiBzLl90b3RhbER1cmF0aW9uKSAtICh0IC0gcy5fc3RhcnRUaW1lKSAqIHMuX3RpbWVTY2FsZSwgZSwgaSkgOiBzLnJlbmRlcigodCAtIHMuX3N0YXJ0VGltZSkgKiBzLl90aW1lU2NhbGUsIGUsIGkpKSwgcyA9IGE7IGVsc2UgZm9yIChzID0gdGhpcy5fbGFzdDsgcyAmJiAoYSA9IHMuX3ByZXYsICF0aGlzLl9wYXVzZWQgfHwgYyk7KShzLl9hY3RpdmUgfHwgdSA+PSBzLl9zdGFydFRpbWUgJiYgIXMuX3BhdXNlZCAmJiAhcy5fZ2MpICYmIChzLl9yZXZlcnNlZCA/IHMucmVuZGVyKChzLl9kaXJ0eSA/IHMudG90YWxEdXJhdGlvbigpIDogcy5fdG90YWxEdXJhdGlvbikgLSAodCAtIHMuX3N0YXJ0VGltZSkgKiBzLl90aW1lU2NhbGUsIGUsIGkpIDogcy5yZW5kZXIoKHQgLSBzLl9zdGFydFRpbWUpICogcy5fdGltZVNjYWxlLCBlLCBpKSksIHMgPSBhO1xuICAgICAgICAgICAgICAgIHRoaXMuX29uVXBkYXRlICYmIChlIHx8IHRoaXMuX29uVXBkYXRlLmFwcGx5KHRoaXMudmFycy5vblVwZGF0ZVNjb3BlIHx8IHRoaXMsIHRoaXMudmFycy5vblVwZGF0ZVBhcmFtcyB8fCBvKSksIGggJiYgKHRoaXMuX2djIHx8IChwID09PSB0aGlzLl9zdGFydFRpbWUgfHwgZiAhPT0gdGhpcy5fdGltZVNjYWxlKSAmJiAoMCA9PT0gdGhpcy5fdGltZSB8fCBfID49IHRoaXMudG90YWxEdXJhdGlvbigpKSAmJiAobiAmJiAodGhpcy5fdGltZWxpbmUuYXV0b1JlbW92ZUNoaWxkcmVuICYmIHRoaXMuX2VuYWJsZWQoITEsICExKSwgdGhpcy5fYWN0aXZlID0gITEpLCAhZSAmJiB0aGlzLnZhcnNbaF0gJiYgdGhpcy52YXJzW2hdLmFwcGx5KHRoaXMudmFyc1toICsgXCJTY29wZVwiXSB8fCB0aGlzLCB0aGlzLnZhcnNbaCArIFwiUGFyYW1zXCJdIHx8IG8pKSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgdS5faGFzUGF1c2VkQ2hpbGQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBmb3IgKHZhciB0ID0gdGhpcy5fZmlyc3Q7IHQ7KSB7XG4gICAgICAgICAgICAgICAgaWYgKHQuX3BhdXNlZCB8fCB0IGluc3RhbmNlb2YgcyAmJiB0Ll9oYXNQYXVzZWRDaGlsZCgpKXJldHVybiEwO1xuICAgICAgICAgICAgICAgIHQgPSB0Ll9uZXh0XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4hMVxuICAgICAgICB9LCB1LmdldENoaWxkcmVuID0gZnVuY3Rpb24gKHQsIGUsIHMsIHIpIHtcbiAgICAgICAgICAgIHIgPSByIHx8IC05OTk5OTk5OTk5O1xuICAgICAgICAgICAgZm9yICh2YXIgbiA9IFtdLCBhID0gdGhpcy5fZmlyc3QsIG8gPSAwOyBhOylyID4gYS5fc3RhcnRUaW1lIHx8IChhIGluc3RhbmNlb2YgaSA/IGUgIT09ICExICYmIChuW28rK10gPSBhKSA6IChzICE9PSAhMSAmJiAobltvKytdID0gYSksIHQgIT09ICExICYmIChuID0gbi5jb25jYXQoYS5nZXRDaGlsZHJlbighMCwgZSwgcykpLCBvID0gbi5sZW5ndGgpKSksIGEgPSBhLl9uZXh0O1xuICAgICAgICAgICAgcmV0dXJuIG5cbiAgICAgICAgfSwgdS5nZXRUd2VlbnNPZiA9IGZ1bmN0aW9uICh0LCBlKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBzID0gaS5nZXRUd2VlbnNPZih0KSwgciA9IHMubGVuZ3RoLCBuID0gW10sIGEgPSAwOyAtLXIgPiAtMTspKHNbcl0udGltZWxpbmUgPT09IHRoaXMgfHwgZSAmJiB0aGlzLl9jb250YWlucyhzW3JdKSkgJiYgKG5bYSsrXSA9IHNbcl0pO1xuICAgICAgICAgICAgcmV0dXJuIG5cbiAgICAgICAgfSwgdS5fY29udGFpbnMgPSBmdW5jdGlvbiAodCkge1xuICAgICAgICAgICAgZm9yICh2YXIgZSA9IHQudGltZWxpbmU7IGU7KSB7XG4gICAgICAgICAgICAgICAgaWYgKGUgPT09IHRoaXMpcmV0dXJuITA7XG4gICAgICAgICAgICAgICAgZSA9IGUudGltZWxpbmVcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiExXG4gICAgICAgIH0sIHUuc2hpZnRDaGlsZHJlbiA9IGZ1bmN0aW9uICh0LCBlLCBpKSB7XG4gICAgICAgICAgICBpID0gaSB8fCAwO1xuICAgICAgICAgICAgZm9yICh2YXIgcywgciA9IHRoaXMuX2ZpcnN0LCBuID0gdGhpcy5fbGFiZWxzOyByOylyLl9zdGFydFRpbWUgPj0gaSAmJiAoci5fc3RhcnRUaW1lICs9IHQpLCByID0gci5fbmV4dDtcbiAgICAgICAgICAgIGlmIChlKWZvciAocyBpbiBuKW5bc10gPj0gaSAmJiAobltzXSArPSB0KTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl91bmNhY2hlKCEwKVxuICAgICAgICB9LCB1Ll9raWxsID0gZnVuY3Rpb24gKHQsIGUpIHtcbiAgICAgICAgICAgIGlmICghdCAmJiAhZSlyZXR1cm4gdGhpcy5fZW5hYmxlZCghMSwgITEpO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IGUgPyB0aGlzLmdldFR3ZWVuc09mKGUpIDogdGhpcy5nZXRDaGlsZHJlbighMCwgITAsICExKSwgcyA9IGkubGVuZ3RoLCByID0gITE7IC0tcyA+IC0xOylpW3NdLl9raWxsKHQsIGUpICYmIChyID0gITApO1xuICAgICAgICAgICAgcmV0dXJuIHJcbiAgICAgICAgfSwgdS5jbGVhciA9IGZ1bmN0aW9uICh0KSB7XG4gICAgICAgICAgICB2YXIgZSA9IHRoaXMuZ2V0Q2hpbGRyZW4oITEsICEwLCAhMCksIGkgPSBlLmxlbmd0aDtcbiAgICAgICAgICAgIGZvciAodGhpcy5fdGltZSA9IHRoaXMuX3RvdGFsVGltZSA9IDA7IC0taSA+IC0xOyllW2ldLl9lbmFibGVkKCExLCAhMSk7XG4gICAgICAgICAgICByZXR1cm4gdCAhPT0gITEgJiYgKHRoaXMuX2xhYmVscyA9IHt9KSwgdGhpcy5fdW5jYWNoZSghMClcbiAgICAgICAgfSwgdS5pbnZhbGlkYXRlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgZm9yICh2YXIgdCA9IHRoaXMuX2ZpcnN0OyB0Oyl0LmludmFsaWRhdGUoKSwgdCA9IHQuX25leHQ7XG4gICAgICAgICAgICByZXR1cm4gdGhpc1xuICAgICAgICB9LCB1Ll9lbmFibGVkID0gZnVuY3Rpb24gKHQsIGkpIHtcbiAgICAgICAgICAgIGlmICh0ID09PSB0aGlzLl9nYylmb3IgKHZhciBzID0gdGhpcy5fZmlyc3Q7IHM7KXMuX2VuYWJsZWQodCwgITApLCBzID0gcy5fbmV4dDtcbiAgICAgICAgICAgIHJldHVybiBlLnByb3RvdHlwZS5fZW5hYmxlZC5jYWxsKHRoaXMsIHQsIGkpXG4gICAgICAgIH0sIHUuZHVyYXRpb24gPSBmdW5jdGlvbiAodCkge1xuICAgICAgICAgICAgcmV0dXJuIGFyZ3VtZW50cy5sZW5ndGggPyAoMCAhPT0gdGhpcy5kdXJhdGlvbigpICYmIDAgIT09IHQgJiYgdGhpcy50aW1lU2NhbGUodGhpcy5fZHVyYXRpb24gLyB0KSwgdGhpcykgOiAodGhpcy5fZGlydHkgJiYgdGhpcy50b3RhbER1cmF0aW9uKCksIHRoaXMuX2R1cmF0aW9uKVxuICAgICAgICB9LCB1LnRvdGFsRHVyYXRpb24gPSBmdW5jdGlvbiAodCkge1xuICAgICAgICAgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuX2RpcnR5KSB7XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGUsIGksIHMgPSAwLCByID0gdGhpcy5fbGFzdCwgbiA9IDk5OTk5OTk5OTk5OTsgcjspZSA9IHIuX3ByZXYsIHIuX2RpcnR5ICYmIHIudG90YWxEdXJhdGlvbigpLCByLl9zdGFydFRpbWUgPiBuICYmIHRoaXMuX3NvcnRDaGlsZHJlbiAmJiAhci5fcGF1c2VkID8gdGhpcy5hZGQociwgci5fc3RhcnRUaW1lIC0gci5fZGVsYXkpIDogbiA9IHIuX3N0YXJ0VGltZSwgMCA+IHIuX3N0YXJ0VGltZSAmJiAhci5fcGF1c2VkICYmIChzIC09IHIuX3N0YXJ0VGltZSwgdGhpcy5fdGltZWxpbmUuc21vb3RoQ2hpbGRUaW1pbmcgJiYgKHRoaXMuX3N0YXJ0VGltZSArPSByLl9zdGFydFRpbWUgLyB0aGlzLl90aW1lU2NhbGUpLCB0aGlzLnNoaWZ0Q2hpbGRyZW4oLXIuX3N0YXJ0VGltZSwgITEsIC05OTk5OTk5OTk5KSwgbiA9IDApLCBpID0gci5fc3RhcnRUaW1lICsgci5fdG90YWxEdXJhdGlvbiAvIHIuX3RpbWVTY2FsZSwgaSA+IHMgJiYgKHMgPSBpKSwgciA9IGU7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2R1cmF0aW9uID0gdGhpcy5fdG90YWxEdXJhdGlvbiA9IHMsIHRoaXMuX2RpcnR5ID0gITFcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3RvdGFsRHVyYXRpb25cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiAwICE9PSB0aGlzLnRvdGFsRHVyYXRpb24oKSAmJiAwICE9PSB0ICYmIHRoaXMudGltZVNjYWxlKHRoaXMuX3RvdGFsRHVyYXRpb24gLyB0KSwgdGhpc1xuICAgICAgICB9LCB1LnVzZXNGcmFtZXMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBlID0gdGhpcy5fdGltZWxpbmU7IGUuX3RpbWVsaW5lOyllID0gZS5fdGltZWxpbmU7XG4gICAgICAgICAgICByZXR1cm4gZSA9PT0gdC5fcm9vdEZyYW1lc1RpbWVsaW5lXG4gICAgICAgIH0sIHUucmF3VGltZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9wYXVzZWQgPyB0aGlzLl90b3RhbFRpbWUgOiAodGhpcy5fdGltZWxpbmUucmF3VGltZSgpIC0gdGhpcy5fc3RhcnRUaW1lKSAqIHRoaXMuX3RpbWVTY2FsZVxuICAgICAgICB9LCBzXG4gICAgfSwgITApXG59KSwgd2luZG93Ll9nc0RlZmluZSAmJiB3aW5kb3cuX2dzUXVldWUucG9wKCkoKTsiLCIvKiFcbiAqIFZFUlNJT046IDEuMTEuMVxuICogREFURTogMjAxMy0xMC0yOVxuICogVVBEQVRFUyBBTkQgRE9DUyBBVDogaHR0cDovL3d3dy5ncmVlbnNvY2suY29tXG4gKlxuICogQGxpY2Vuc2UgQ29weXJpZ2h0IChjKSAyMDA4LTIwMTMsIEdyZWVuU29jay4gQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqIFRoaXMgd29yayBpcyBzdWJqZWN0IHRvIHRoZSB0ZXJtcyBhdCBodHRwOi8vd3d3LmdyZWVuc29jay5jb20vdGVybXNfb2ZfdXNlLmh0bWwgb3IgZm9yXG4gKiBDbHViIEdyZWVuU29jayBtZW1iZXJzLCB0aGUgc29mdHdhcmUgYWdyZWVtZW50IHRoYXQgd2FzIGlzc3VlZCB3aXRoIHlvdXIgbWVtYmVyc2hpcC5cbiAqIFxuICogQGF1dGhvcjogSmFjayBEb3lsZSwgamFja0BncmVlbnNvY2suY29tXG4gKi9cbihmdW5jdGlvbiAodCkge1xuICAgIFwidXNlIHN0cmljdFwiO1xuICAgIHZhciBlID0gdC5HcmVlblNvY2tHbG9iYWxzIHx8IHQ7XG4gICAgaWYgKCFlLlR3ZWVuTGl0ZSkge1xuICAgICAgICB2YXIgaSwgcywgciwgbiwgYSwgbyA9IGZ1bmN0aW9uICh0KSB7XG4gICAgICAgICAgICB2YXIgaSwgcyA9IHQuc3BsaXQoXCIuXCIpLCByID0gZTtcbiAgICAgICAgICAgIGZvciAoaSA9IDA7IHMubGVuZ3RoID4gaTsgaSsrKXJbc1tpXV0gPSByID0gcltzW2ldXSB8fCB7fTtcbiAgICAgICAgICAgIHJldHVybiByXG4gICAgICAgIH0sIGwgPSBvKFwiY29tLmdyZWVuc29ja1wiKSwgaCA9IDFlLTEwLCBfID0gW10uc2xpY2UsIHUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIH0sIG0gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgdCA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcsIGUgPSB0LmNhbGwoW10pO1xuICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGkgaW5zdGFuY2VvZiBBcnJheSB8fCBcIm9iamVjdFwiID09IHR5cGVvZiBpICYmICEhaS5wdXNoICYmIHQuY2FsbChpKSA9PT0gZVxuICAgICAgICAgICAgfVxuICAgICAgICB9KCksIGYgPSB7fSwgcCA9IGZ1bmN0aW9uIChpLCBzLCByLCBuKSB7XG4gICAgICAgICAgICB0aGlzLnNjID0gZltpXSA/IGZbaV0uc2MgOiBbXSwgZltpXSA9IHRoaXMsIHRoaXMuZ3NDbGFzcyA9IG51bGwsIHRoaXMuZnVuYyA9IHI7XG4gICAgICAgICAgICB2YXIgYSA9IFtdO1xuICAgICAgICAgICAgdGhpcy5jaGVjayA9IGZ1bmN0aW9uIChsKSB7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaCwgXywgdSwgbSwgYyA9IHMubGVuZ3RoLCBkID0gYzsgLS1jID4gLTE7KShoID0gZltzW2NdXSB8fCBuZXcgcChzW2NdLCBbXSkpLmdzQ2xhc3MgPyAoYVtjXSA9IGguZ3NDbGFzcywgZC0tKSA6IGwgJiYgaC5zYy5wdXNoKHRoaXMpO1xuICAgICAgICAgICAgICAgIGlmICgwID09PSBkICYmIHIpZm9yIChfID0gKFwiY29tLmdyZWVuc29jay5cIiArIGkpLnNwbGl0KFwiLlwiKSwgdSA9IF8ucG9wKCksIG0gPSBvKF8uam9pbihcIi5cIikpW3VdID0gdGhpcy5nc0NsYXNzID0gci5hcHBseShyLCBhKSwgbiAmJiAoZVt1XSA9IG0sIFwiZnVuY3Rpb25cIiA9PSB0eXBlb2YgZGVmaW5lICYmIGRlZmluZS5hbWQgPyBkZWZpbmUoKHQuR3JlZW5Tb2NrQU1EUGF0aCA/IHQuR3JlZW5Tb2NrQU1EUGF0aCArIFwiL1wiIDogXCJcIikgKyBpLnNwbGl0KFwiLlwiKS5qb2luKFwiL1wiKSwgW10sIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG1cbiAgICAgICAgICAgICAgICB9KSA6IFwidW5kZWZpbmVkXCIgIT0gdHlwZW9mIG1vZHVsZSAmJiBtb2R1bGUuZXhwb3J0cyAmJiAobW9kdWxlLmV4cG9ydHMgPSBtKSksIGMgPSAwOyB0aGlzLnNjLmxlbmd0aCA+IGM7IGMrKyl0aGlzLnNjW2NdLmNoZWNrKClcbiAgICAgICAgICAgIH0sIHRoaXMuY2hlY2soITApXG4gICAgICAgIH0sIGMgPSB0Ll9nc0RlZmluZSA9IGZ1bmN0aW9uICh0LCBlLCBpLCBzKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IHAodCwgZSwgaSwgcylcbiAgICAgICAgfSwgZCA9IGwuX2NsYXNzID0gZnVuY3Rpb24gKHQsIGUsIGkpIHtcbiAgICAgICAgICAgIHJldHVybiBlID0gZSB8fCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB9LCBjKHQsIFtdLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGVcbiAgICAgICAgICAgIH0sIGkpLCBlXG4gICAgICAgIH07XG4gICAgICAgIGMuZ2xvYmFscyA9IGU7XG4gICAgICAgIHZhciB2ID0gWzAsIDAsIDEsIDFdLCBnID0gW10sIFQgPSBkKFwiZWFzaW5nLkVhc2VcIiwgZnVuY3Rpb24gKHQsIGUsIGksIHMpIHtcbiAgICAgICAgICAgIHRoaXMuX2Z1bmMgPSB0LCB0aGlzLl90eXBlID0gaSB8fCAwLCB0aGlzLl9wb3dlciA9IHMgfHwgMCwgdGhpcy5fcGFyYW1zID0gZSA/IHYuY29uY2F0KGUpIDogdlxuICAgICAgICB9LCAhMCksIHcgPSBULm1hcCA9IHt9LCBQID0gVC5yZWdpc3RlciA9IGZ1bmN0aW9uICh0LCBlLCBpLCBzKSB7XG4gICAgICAgICAgICBmb3IgKHZhciByLCBuLCBhLCBvLCBoID0gZS5zcGxpdChcIixcIiksIF8gPSBoLmxlbmd0aCwgdSA9IChpIHx8IFwiZWFzZUluLGVhc2VPdXQsZWFzZUluT3V0XCIpLnNwbGl0KFwiLFwiKTsgLS1fID4gLTE7KWZvciAobiA9IGhbX10sIHIgPSBzID8gZChcImVhc2luZy5cIiArIG4sIG51bGwsICEwKSA6IGwuZWFzaW5nW25dIHx8IHt9LCBhID0gdS5sZW5ndGg7IC0tYSA+IC0xOylvID0gdVthXSwgd1tuICsgXCIuXCIgKyBvXSA9IHdbbyArIG5dID0gcltvXSA9IHQuZ2V0UmF0aW8gPyB0IDogdFtvXSB8fCBuZXcgdFxuICAgICAgICB9O1xuICAgICAgICBmb3IgKHIgPSBULnByb3RvdHlwZSwgci5fY2FsY0VuZCA9ICExLCByLmdldFJhdGlvID0gZnVuY3Rpb24gKHQpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLl9mdW5jKXJldHVybiB0aGlzLl9wYXJhbXNbMF0gPSB0LCB0aGlzLl9mdW5jLmFwcGx5KG51bGwsIHRoaXMuX3BhcmFtcyk7XG4gICAgICAgICAgICB2YXIgZSA9IHRoaXMuX3R5cGUsIGkgPSB0aGlzLl9wb3dlciwgcyA9IDEgPT09IGUgPyAxIC0gdCA6IDIgPT09IGUgPyB0IDogLjUgPiB0ID8gMiAqIHQgOiAyICogKDEgLSB0KTtcbiAgICAgICAgICAgIHJldHVybiAxID09PSBpID8gcyAqPSBzIDogMiA9PT0gaSA/IHMgKj0gcyAqIHMgOiAzID09PSBpID8gcyAqPSBzICogcyAqIHMgOiA0ID09PSBpICYmIChzICo9IHMgKiBzICogcyAqIHMpLCAxID09PSBlID8gMSAtIHMgOiAyID09PSBlID8gcyA6IC41ID4gdCA/IHMgLyAyIDogMSAtIHMgLyAyXG4gICAgICAgIH0sIGkgPSBbXCJMaW5lYXJcIiwgXCJRdWFkXCIsIFwiQ3ViaWNcIiwgXCJRdWFydFwiLCBcIlF1aW50LFN0cm9uZ1wiXSwgcyA9IGkubGVuZ3RoOyAtLXMgPiAtMTspciA9IGlbc10gKyBcIixQb3dlclwiICsgcywgUChuZXcgVChudWxsLCBudWxsLCAxLCBzKSwgciwgXCJlYXNlT3V0XCIsICEwKSwgUChuZXcgVChudWxsLCBudWxsLCAyLCBzKSwgciwgXCJlYXNlSW5cIiArICgwID09PSBzID8gXCIsZWFzZU5vbmVcIiA6IFwiXCIpKSwgUChuZXcgVChudWxsLCBudWxsLCAzLCBzKSwgciwgXCJlYXNlSW5PdXRcIik7XG4gICAgICAgIHcubGluZWFyID0gbC5lYXNpbmcuTGluZWFyLmVhc2VJbiwgdy5zd2luZyA9IGwuZWFzaW5nLlF1YWQuZWFzZUluT3V0O1xuICAgICAgICB2YXIgeSA9IGQoXCJldmVudHMuRXZlbnREaXNwYXRjaGVyXCIsIGZ1bmN0aW9uICh0KSB7XG4gICAgICAgICAgICB0aGlzLl9saXN0ZW5lcnMgPSB7fSwgdGhpcy5fZXZlbnRUYXJnZXQgPSB0IHx8IHRoaXNcbiAgICAgICAgfSk7XG4gICAgICAgIHIgPSB5LnByb3RvdHlwZSwgci5hZGRFdmVudExpc3RlbmVyID0gZnVuY3Rpb24gKHQsIGUsIGksIHMsIHIpIHtcbiAgICAgICAgICAgIHIgPSByIHx8IDA7XG4gICAgICAgICAgICB2YXIgbywgbCwgaCA9IHRoaXMuX2xpc3RlbmVyc1t0XSwgXyA9IDA7XG4gICAgICAgICAgICBmb3IgKG51bGwgPT0gaCAmJiAodGhpcy5fbGlzdGVuZXJzW3RdID0gaCA9IFtdKSwgbCA9IGgubGVuZ3RoOyAtLWwgPiAtMTspbyA9IGhbbF0sIG8uYyA9PT0gZSAmJiBvLnMgPT09IGkgPyBoLnNwbGljZShsLCAxKSA6IDAgPT09IF8gJiYgciA+IG8ucHIgJiYgKF8gPSBsICsgMSk7XG4gICAgICAgICAgICBoLnNwbGljZShfLCAwLCB7YzogZSwgczogaSwgdXA6IHMsIHByOiByfSksIHRoaXMgIT09IG4gfHwgYSB8fCBuLndha2UoKVxuICAgICAgICB9LCByLnJlbW92ZUV2ZW50TGlzdGVuZXIgPSBmdW5jdGlvbiAodCwgZSkge1xuICAgICAgICAgICAgdmFyIGksIHMgPSB0aGlzLl9saXN0ZW5lcnNbdF07XG4gICAgICAgICAgICBpZiAocylmb3IgKGkgPSBzLmxlbmd0aDsgLS1pID4gLTE7KWlmIChzW2ldLmMgPT09IGUpcmV0dXJuIHMuc3BsaWNlKGksIDEpLCB2b2lkIDBcbiAgICAgICAgfSwgci5kaXNwYXRjaEV2ZW50ID0gZnVuY3Rpb24gKHQpIHtcbiAgICAgICAgICAgIHZhciBlLCBpLCBzLCByID0gdGhpcy5fbGlzdGVuZXJzW3RdO1xuICAgICAgICAgICAgaWYgKHIpZm9yIChlID0gci5sZW5ndGgsIGkgPSB0aGlzLl9ldmVudFRhcmdldDsgLS1lID4gLTE7KXMgPSByW2VdLCBzLnVwID8gcy5jLmNhbGwocy5zIHx8IGksIHt0eXBlOiB0LCB0YXJnZXQ6IGl9KSA6IHMuYy5jYWxsKHMucyB8fCBpKVxuICAgICAgICB9O1xuICAgICAgICB2YXIgYiA9IHQucmVxdWVzdEFuaW1hdGlvbkZyYW1lLCBrID0gdC5jYW5jZWxBbmltYXRpb25GcmFtZSwgQSA9IERhdGUubm93IHx8IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybihuZXcgRGF0ZSkuZ2V0VGltZSgpXG4gICAgICAgIH0sIFMgPSBBKCk7XG4gICAgICAgIGZvciAoaSA9IFtcIm1zXCIsIFwibW96XCIsIFwid2Via2l0XCIsIFwib1wiXSwgcyA9IGkubGVuZ3RoOyAtLXMgPiAtMSAmJiAhYjspYiA9IHRbaVtzXSArIFwiUmVxdWVzdEFuaW1hdGlvbkZyYW1lXCJdLCBrID0gdFtpW3NdICsgXCJDYW5jZWxBbmltYXRpb25GcmFtZVwiXSB8fCB0W2lbc10gKyBcIkNhbmNlbFJlcXVlc3RBbmltYXRpb25GcmFtZVwiXTtcbiAgICAgICAgZChcIlRpY2tlclwiLCBmdW5jdGlvbiAodCwgZSkge1xuICAgICAgICAgICAgdmFyIGksIHMsIHIsIG8sIGwsIGggPSB0aGlzLCBfID0gQSgpLCBtID0gZSAhPT0gITEgJiYgYiwgZiA9IGZ1bmN0aW9uICh0KSB7XG4gICAgICAgICAgICAgICAgUyA9IEEoKSwgaC50aW1lID0gKFMgLSBfKSAvIDFlMztcbiAgICAgICAgICAgICAgICB2YXIgZSwgbiA9IGgudGltZSAtIGw7XG4gICAgICAgICAgICAgICAgKCFpIHx8IG4gPiAwIHx8IHQgPT09ICEwKSAmJiAoaC5mcmFtZSsrLCBsICs9IG4gKyAobiA+PSBvID8gLjAwNCA6IG8gLSBuKSwgZSA9ICEwKSwgdCAhPT0gITAgJiYgKHIgPSBzKGYpKSwgZSAmJiBoLmRpc3BhdGNoRXZlbnQoXCJ0aWNrXCIpXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgeS5jYWxsKGgpLCBoLnRpbWUgPSBoLmZyYW1lID0gMCwgaC50aWNrID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGYoITApXG4gICAgICAgICAgICB9LCBoLnNsZWVwID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIG51bGwgIT0gciAmJiAobSAmJiBrID8gayhyKSA6IGNsZWFyVGltZW91dChyKSwgcyA9IHUsIHIgPSBudWxsLCBoID09PSBuICYmIChhID0gITEpKVxuICAgICAgICAgICAgfSwgaC53YWtlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIG51bGwgIT09IHIgJiYgaC5zbGVlcCgpLCBzID0gMCA9PT0gaSA/IHUgOiBtICYmIGIgPyBiIDogZnVuY3Rpb24gKHQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHNldFRpbWVvdXQodCwgMCB8IDFlMyAqIChsIC0gaC50aW1lKSArIDEpXG4gICAgICAgICAgICAgICAgfSwgaCA9PT0gbiAmJiAoYSA9ICEwKSwgZigyKVxuICAgICAgICAgICAgfSwgaC5mcHMgPSBmdW5jdGlvbiAodCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBhcmd1bWVudHMubGVuZ3RoID8gKGkgPSB0LCBvID0gMSAvIChpIHx8IDYwKSwgbCA9IHRoaXMudGltZSArIG8sIGgud2FrZSgpLCB2b2lkIDApIDogaVxuICAgICAgICAgICAgfSwgaC51c2VSQUYgPSBmdW5jdGlvbiAodCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBhcmd1bWVudHMubGVuZ3RoID8gKGguc2xlZXAoKSwgbSA9IHQsIGguZnBzKGkpLCB2b2lkIDApIDogbVxuICAgICAgICAgICAgfSwgaC5mcHModCksIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIG0gJiYgKCFyIHx8IDUgPiBoLmZyYW1lKSAmJiBoLnVzZVJBRighMSlcbiAgICAgICAgICAgIH0sIDE1MDApXG4gICAgICAgIH0pLCByID0gbC5UaWNrZXIucHJvdG90eXBlID0gbmV3IGwuZXZlbnRzLkV2ZW50RGlzcGF0Y2hlciwgci5jb25zdHJ1Y3RvciA9IGwuVGlja2VyO1xuICAgICAgICB2YXIgeCA9IGQoXCJjb3JlLkFuaW1hdGlvblwiLCBmdW5jdGlvbiAodCwgZSkge1xuICAgICAgICAgICAgaWYgKHRoaXMudmFycyA9IGUgPSBlIHx8IHt9LCB0aGlzLl9kdXJhdGlvbiA9IHRoaXMuX3RvdGFsRHVyYXRpb24gPSB0IHx8IDAsIHRoaXMuX2RlbGF5ID0gTnVtYmVyKGUuZGVsYXkpIHx8IDAsIHRoaXMuX3RpbWVTY2FsZSA9IDEsIHRoaXMuX2FjdGl2ZSA9IGUuaW1tZWRpYXRlUmVuZGVyID09PSAhMCwgdGhpcy5kYXRhID0gZS5kYXRhLCB0aGlzLl9yZXZlcnNlZCA9IGUucmV2ZXJzZWQgPT09ICEwLCBRKSB7XG4gICAgICAgICAgICAgICAgYSB8fCBuLndha2UoKTtcbiAgICAgICAgICAgICAgICB2YXIgaSA9IHRoaXMudmFycy51c2VGcmFtZXMgPyBHIDogUTtcbiAgICAgICAgICAgICAgICBpLmFkZCh0aGlzLCBpLl90aW1lKSwgdGhpcy52YXJzLnBhdXNlZCAmJiB0aGlzLnBhdXNlZCghMClcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIG4gPSB4LnRpY2tlciA9IG5ldyBsLlRpY2tlciwgciA9IHgucHJvdG90eXBlLCByLl9kaXJ0eSA9IHIuX2djID0gci5faW5pdHRlZCA9IHIuX3BhdXNlZCA9ICExLCByLl90b3RhbFRpbWUgPSByLl90aW1lID0gMCwgci5fcmF3UHJldlRpbWUgPSAtMSwgci5fbmV4dCA9IHIuX2xhc3QgPSByLl9vblVwZGF0ZSA9IHIuX3RpbWVsaW5lID0gci50aW1lbGluZSA9IG51bGwsIHIuX3BhdXNlZCA9ICExO1xuICAgICAgICB2YXIgQyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIEEoKSAtIFMgPiAyZTMgJiYgbi53YWtlKCksIHNldFRpbWVvdXQoQywgMmUzKVxuICAgICAgICB9O1xuICAgICAgICBDKCksIHIucGxheSA9IGZ1bmN0aW9uICh0LCBlKSB7XG4gICAgICAgICAgICByZXR1cm4gYXJndW1lbnRzLmxlbmd0aCAmJiB0aGlzLnNlZWsodCwgZSksIHRoaXMucmV2ZXJzZWQoITEpLnBhdXNlZCghMSlcbiAgICAgICAgfSwgci5wYXVzZSA9IGZ1bmN0aW9uICh0LCBlKSB7XG4gICAgICAgICAgICByZXR1cm4gYXJndW1lbnRzLmxlbmd0aCAmJiB0aGlzLnNlZWsodCwgZSksIHRoaXMucGF1c2VkKCEwKVxuICAgICAgICB9LCByLnJlc3VtZSA9IGZ1bmN0aW9uICh0LCBlKSB7XG4gICAgICAgICAgICByZXR1cm4gYXJndW1lbnRzLmxlbmd0aCAmJiB0aGlzLnNlZWsodCwgZSksIHRoaXMucGF1c2VkKCExKVxuICAgICAgICB9LCByLnNlZWsgPSBmdW5jdGlvbiAodCwgZSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMudG90YWxUaW1lKE51bWJlcih0KSwgZSAhPT0gITEpXG4gICAgICAgIH0sIHIucmVzdGFydCA9IGZ1bmN0aW9uICh0LCBlKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5yZXZlcnNlZCghMSkucGF1c2VkKCExKS50b3RhbFRpbWUodCA/IC10aGlzLl9kZWxheSA6IDAsIGUgIT09ICExLCAhMClcbiAgICAgICAgfSwgci5yZXZlcnNlID0gZnVuY3Rpb24gKHQsIGUpIHtcbiAgICAgICAgICAgIHJldHVybiBhcmd1bWVudHMubGVuZ3RoICYmIHRoaXMuc2Vlayh0IHx8IHRoaXMudG90YWxEdXJhdGlvbigpLCBlKSwgdGhpcy5yZXZlcnNlZCghMCkucGF1c2VkKCExKVxuICAgICAgICB9LCByLnJlbmRlciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgfSwgci5pbnZhbGlkYXRlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXNcbiAgICAgICAgfSwgci5pc0FjdGl2ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciB0LCBlID0gdGhpcy5fdGltZWxpbmUsIGkgPSB0aGlzLl9zdGFydFRpbWU7XG4gICAgICAgICAgICByZXR1cm4hZSB8fCAhdGhpcy5fZ2MgJiYgIXRoaXMuX3BhdXNlZCAmJiBlLmlzQWN0aXZlKCkgJiYgKHQgPSBlLnJhd1RpbWUoKSkgPj0gaSAmJiBpICsgdGhpcy50b3RhbER1cmF0aW9uKCkgLyB0aGlzLl90aW1lU2NhbGUgPiB0XG4gICAgICAgIH0sIHIuX2VuYWJsZWQgPSBmdW5jdGlvbiAodCwgZSkge1xuICAgICAgICAgICAgcmV0dXJuIGEgfHwgbi53YWtlKCksIHRoaXMuX2djID0gIXQsIHRoaXMuX2FjdGl2ZSA9IHRoaXMuaXNBY3RpdmUoKSwgZSAhPT0gITAgJiYgKHQgJiYgIXRoaXMudGltZWxpbmUgPyB0aGlzLl90aW1lbGluZS5hZGQodGhpcywgdGhpcy5fc3RhcnRUaW1lIC0gdGhpcy5fZGVsYXkpIDogIXQgJiYgdGhpcy50aW1lbGluZSAmJiB0aGlzLl90aW1lbGluZS5fcmVtb3ZlKHRoaXMsICEwKSksICExXG4gICAgICAgIH0sIHIuX2tpbGwgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fZW5hYmxlZCghMSwgITEpXG4gICAgICAgIH0sIHIua2lsbCA9IGZ1bmN0aW9uICh0LCBlKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fa2lsbCh0LCBlKSwgdGhpc1xuICAgICAgICB9LCByLl91bmNhY2hlID0gZnVuY3Rpb24gKHQpIHtcbiAgICAgICAgICAgIGZvciAodmFyIGUgPSB0ID8gdGhpcyA6IHRoaXMudGltZWxpbmU7IGU7KWUuX2RpcnR5ID0gITAsIGUgPSBlLnRpbWVsaW5lO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXNcbiAgICAgICAgfSwgci5fc3dhcFNlbGZJblBhcmFtcyA9IGZ1bmN0aW9uICh0KSB7XG4gICAgICAgICAgICBmb3IgKHZhciBlID0gdC5sZW5ndGgsIGkgPSB0LmNvbmNhdCgpOyAtLWUgPiAtMTspXCJ7c2VsZn1cIiA9PT0gdFtlXSAmJiAoaVtlXSA9IHRoaXMpO1xuICAgICAgICAgICAgcmV0dXJuIGlcbiAgICAgICAgfSwgci5ldmVudENhbGxiYWNrID0gZnVuY3Rpb24gKHQsIGUsIGksIHMpIHtcbiAgICAgICAgICAgIGlmIChcIm9uXCIgPT09ICh0IHx8IFwiXCIpLnN1YnN0cigwLCAyKSkge1xuICAgICAgICAgICAgICAgIHZhciByID0gdGhpcy52YXJzO1xuICAgICAgICAgICAgICAgIGlmICgxID09PSBhcmd1bWVudHMubGVuZ3RoKXJldHVybiByW3RdO1xuICAgICAgICAgICAgICAgIG51bGwgPT0gZSA/IGRlbGV0ZSByW3RdIDogKHJbdF0gPSBlLCByW3QgKyBcIlBhcmFtc1wiXSA9IG0oaSkgJiYgLTEgIT09IGkuam9pbihcIlwiKS5pbmRleE9mKFwie3NlbGZ9XCIpID8gdGhpcy5fc3dhcFNlbGZJblBhcmFtcyhpKSA6IGksIHJbdCArIFwiU2NvcGVcIl0gPSBzKSwgXCJvblVwZGF0ZVwiID09PSB0ICYmICh0aGlzLl9vblVwZGF0ZSA9IGUpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdGhpc1xuICAgICAgICB9LCByLmRlbGF5ID0gZnVuY3Rpb24gKHQpIHtcbiAgICAgICAgICAgIHJldHVybiBhcmd1bWVudHMubGVuZ3RoID8gKHRoaXMuX3RpbWVsaW5lLnNtb290aENoaWxkVGltaW5nICYmIHRoaXMuc3RhcnRUaW1lKHRoaXMuX3N0YXJ0VGltZSArIHQgLSB0aGlzLl9kZWxheSksIHRoaXMuX2RlbGF5ID0gdCwgdGhpcykgOiB0aGlzLl9kZWxheVxuICAgICAgICB9LCByLmR1cmF0aW9uID0gZnVuY3Rpb24gKHQpIHtcbiAgICAgICAgICAgIHJldHVybiBhcmd1bWVudHMubGVuZ3RoID8gKHRoaXMuX2R1cmF0aW9uID0gdGhpcy5fdG90YWxEdXJhdGlvbiA9IHQsIHRoaXMuX3VuY2FjaGUoITApLCB0aGlzLl90aW1lbGluZS5zbW9vdGhDaGlsZFRpbWluZyAmJiB0aGlzLl90aW1lID4gMCAmJiB0aGlzLl90aW1lIDwgdGhpcy5fZHVyYXRpb24gJiYgMCAhPT0gdCAmJiB0aGlzLnRvdGFsVGltZSh0aGlzLl90b3RhbFRpbWUgKiAodCAvIHRoaXMuX2R1cmF0aW9uKSwgITApLCB0aGlzKSA6ICh0aGlzLl9kaXJ0eSA9ICExLCB0aGlzLl9kdXJhdGlvbilcbiAgICAgICAgfSwgci50b3RhbER1cmF0aW9uID0gZnVuY3Rpb24gKHQpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9kaXJ0eSA9ICExLCBhcmd1bWVudHMubGVuZ3RoID8gdGhpcy5kdXJhdGlvbih0KSA6IHRoaXMuX3RvdGFsRHVyYXRpb25cbiAgICAgICAgfSwgci50aW1lID0gZnVuY3Rpb24gKHQsIGUpIHtcbiAgICAgICAgICAgIHJldHVybiBhcmd1bWVudHMubGVuZ3RoID8gKHRoaXMuX2RpcnR5ICYmIHRoaXMudG90YWxEdXJhdGlvbigpLCB0aGlzLnRvdGFsVGltZSh0ID4gdGhpcy5fZHVyYXRpb24gPyB0aGlzLl9kdXJhdGlvbiA6IHQsIGUpKSA6IHRoaXMuX3RpbWVcbiAgICAgICAgfSwgci50b3RhbFRpbWUgPSBmdW5jdGlvbiAodCwgZSwgaSkge1xuICAgICAgICAgICAgaWYgKGEgfHwgbi53YWtlKCksICFhcmd1bWVudHMubGVuZ3RoKXJldHVybiB0aGlzLl90b3RhbFRpbWU7XG4gICAgICAgICAgICBpZiAodGhpcy5fdGltZWxpbmUpIHtcbiAgICAgICAgICAgICAgICBpZiAoMCA+IHQgJiYgIWkgJiYgKHQgKz0gdGhpcy50b3RhbER1cmF0aW9uKCkpLCB0aGlzLl90aW1lbGluZS5zbW9vdGhDaGlsZFRpbWluZykge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9kaXJ0eSAmJiB0aGlzLnRvdGFsRHVyYXRpb24oKTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHMgPSB0aGlzLl90b3RhbER1cmF0aW9uLCByID0gdGhpcy5fdGltZWxpbmU7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0ID4gcyAmJiAhaSAmJiAodCA9IHMpLCB0aGlzLl9zdGFydFRpbWUgPSAodGhpcy5fcGF1c2VkID8gdGhpcy5fcGF1c2VUaW1lIDogci5fdGltZSkgLSAodGhpcy5fcmV2ZXJzZWQgPyBzIC0gdCA6IHQpIC8gdGhpcy5fdGltZVNjYWxlLCByLl9kaXJ0eSB8fCB0aGlzLl91bmNhY2hlKCExKSwgci5fdGltZWxpbmUpZm9yICg7IHIuX3RpbWVsaW5lOylyLl90aW1lbGluZS5fdGltZSAhPT0gKHIuX3N0YXJ0VGltZSArIHIuX3RvdGFsVGltZSkgLyByLl90aW1lU2NhbGUgJiYgci50b3RhbFRpbWUoci5fdG90YWxUaW1lLCAhMCksIHIgPSByLl90aW1lbGluZVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLl9nYyAmJiB0aGlzLl9lbmFibGVkKCEwLCAhMSksICh0aGlzLl90b3RhbFRpbWUgIT09IHQgfHwgMCA9PT0gdGhpcy5fZHVyYXRpb24pICYmIHRoaXMucmVuZGVyKHQsIGUsICExKVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRoaXNcbiAgICAgICAgfSwgci5wcm9ncmVzcyA9IHIudG90YWxQcm9ncmVzcyA9IGZ1bmN0aW9uICh0LCBlKSB7XG4gICAgICAgICAgICByZXR1cm4gYXJndW1lbnRzLmxlbmd0aCA/IHRoaXMudG90YWxUaW1lKHRoaXMuZHVyYXRpb24oKSAqIHQsIGUpIDogdGhpcy5fdGltZSAvIHRoaXMuZHVyYXRpb24oKVxuICAgICAgICB9LCByLnN0YXJ0VGltZSA9IGZ1bmN0aW9uICh0KSB7XG4gICAgICAgICAgICByZXR1cm4gYXJndW1lbnRzLmxlbmd0aCA/ICh0ICE9PSB0aGlzLl9zdGFydFRpbWUgJiYgKHRoaXMuX3N0YXJ0VGltZSA9IHQsIHRoaXMudGltZWxpbmUgJiYgdGhpcy50aW1lbGluZS5fc29ydENoaWxkcmVuICYmIHRoaXMudGltZWxpbmUuYWRkKHRoaXMsIHQgLSB0aGlzLl9kZWxheSkpLCB0aGlzKSA6IHRoaXMuX3N0YXJ0VGltZVxuICAgICAgICB9LCByLnRpbWVTY2FsZSA9IGZ1bmN0aW9uICh0KSB7XG4gICAgICAgICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpcmV0dXJuIHRoaXMuX3RpbWVTY2FsZTtcbiAgICAgICAgICAgIGlmICh0ID0gdCB8fCBoLCB0aGlzLl90aW1lbGluZSAmJiB0aGlzLl90aW1lbGluZS5zbW9vdGhDaGlsZFRpbWluZykge1xuICAgICAgICAgICAgICAgIHZhciBlID0gdGhpcy5fcGF1c2VUaW1lLCBpID0gZSB8fCAwID09PSBlID8gZSA6IHRoaXMuX3RpbWVsaW5lLnRvdGFsVGltZSgpO1xuICAgICAgICAgICAgICAgIHRoaXMuX3N0YXJ0VGltZSA9IGkgLSAoaSAtIHRoaXMuX3N0YXJ0VGltZSkgKiB0aGlzLl90aW1lU2NhbGUgLyB0XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fdGltZVNjYWxlID0gdCwgdGhpcy5fdW5jYWNoZSghMSlcbiAgICAgICAgfSwgci5yZXZlcnNlZCA9IGZ1bmN0aW9uICh0KSB7XG4gICAgICAgICAgICByZXR1cm4gYXJndW1lbnRzLmxlbmd0aCA/ICh0ICE9IHRoaXMuX3JldmVyc2VkICYmICh0aGlzLl9yZXZlcnNlZCA9IHQsIHRoaXMudG90YWxUaW1lKHRoaXMuX3RvdGFsVGltZSwgITApKSwgdGhpcykgOiB0aGlzLl9yZXZlcnNlZFxuICAgICAgICB9LCByLnBhdXNlZCA9IGZ1bmN0aW9uICh0KSB7XG4gICAgICAgICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpcmV0dXJuIHRoaXMuX3BhdXNlZDtcbiAgICAgICAgICAgIGlmICh0ICE9IHRoaXMuX3BhdXNlZCAmJiB0aGlzLl90aW1lbGluZSkge1xuICAgICAgICAgICAgICAgIGEgfHwgdCB8fCBuLndha2UoKTtcbiAgICAgICAgICAgICAgICB2YXIgZSA9IHRoaXMuX3RpbWVsaW5lLCBpID0gZS5yYXdUaW1lKCksIHMgPSBpIC0gdGhpcy5fcGF1c2VUaW1lO1xuICAgICAgICAgICAgICAgICF0ICYmIGUuc21vb3RoQ2hpbGRUaW1pbmcgJiYgKHRoaXMuX3N0YXJ0VGltZSArPSBzLCB0aGlzLl91bmNhY2hlKCExKSksIHRoaXMuX3BhdXNlVGltZSA9IHQgPyBpIDogbnVsbCwgdGhpcy5fcGF1c2VkID0gdCwgdGhpcy5fYWN0aXZlID0gdGhpcy5pc0FjdGl2ZSgpLCAhdCAmJiAwICE9PSBzICYmIHRoaXMuX2luaXR0ZWQgJiYgdGhpcy5kdXJhdGlvbigpICYmIHRoaXMucmVuZGVyKGUuc21vb3RoQ2hpbGRUaW1pbmcgPyB0aGlzLl90b3RhbFRpbWUgOiAoaSAtIHRoaXMuX3N0YXJ0VGltZSkgLyB0aGlzLl90aW1lU2NhbGUsICEwLCAhMClcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9nYyAmJiAhdCAmJiB0aGlzLl9lbmFibGVkKCEwLCAhMSksIHRoaXNcbiAgICAgICAgfTtcbiAgICAgICAgdmFyIFIgPSBkKFwiY29yZS5TaW1wbGVUaW1lbGluZVwiLCBmdW5jdGlvbiAodCkge1xuICAgICAgICAgICAgeC5jYWxsKHRoaXMsIDAsIHQpLCB0aGlzLmF1dG9SZW1vdmVDaGlsZHJlbiA9IHRoaXMuc21vb3RoQ2hpbGRUaW1pbmcgPSAhMFxuICAgICAgICB9KTtcbiAgICAgICAgciA9IFIucHJvdG90eXBlID0gbmV3IHgsIHIuY29uc3RydWN0b3IgPSBSLCByLmtpbGwoKS5fZ2MgPSAhMSwgci5fZmlyc3QgPSByLl9sYXN0ID0gbnVsbCwgci5fc29ydENoaWxkcmVuID0gITEsIHIuYWRkID0gci5pbnNlcnQgPSBmdW5jdGlvbiAodCwgZSkge1xuICAgICAgICAgICAgdmFyIGksIHM7XG4gICAgICAgICAgICBpZiAodC5fc3RhcnRUaW1lID0gTnVtYmVyKGUgfHwgMCkgKyB0Ll9kZWxheSwgdC5fcGF1c2VkICYmIHRoaXMgIT09IHQuX3RpbWVsaW5lICYmICh0Ll9wYXVzZVRpbWUgPSB0Ll9zdGFydFRpbWUgKyAodGhpcy5yYXdUaW1lKCkgLSB0Ll9zdGFydFRpbWUpIC8gdC5fdGltZVNjYWxlKSwgdC50aW1lbGluZSAmJiB0LnRpbWVsaW5lLl9yZW1vdmUodCwgITApLCB0LnRpbWVsaW5lID0gdC5fdGltZWxpbmUgPSB0aGlzLCB0Ll9nYyAmJiB0Ll9lbmFibGVkKCEwLCAhMCksIGkgPSB0aGlzLl9sYXN0LCB0aGlzLl9zb3J0Q2hpbGRyZW4pZm9yIChzID0gdC5fc3RhcnRUaW1lOyBpICYmIGkuX3N0YXJ0VGltZSA+IHM7KWkgPSBpLl9wcmV2O1xuICAgICAgICAgICAgcmV0dXJuIGkgPyAodC5fbmV4dCA9IGkuX25leHQsIGkuX25leHQgPSB0KSA6ICh0Ll9uZXh0ID0gdGhpcy5fZmlyc3QsIHRoaXMuX2ZpcnN0ID0gdCksIHQuX25leHQgPyB0Ll9uZXh0Ll9wcmV2ID0gdCA6IHRoaXMuX2xhc3QgPSB0LCB0Ll9wcmV2ID0gaSwgdGhpcy5fdGltZWxpbmUgJiYgdGhpcy5fdW5jYWNoZSghMCksIHRoaXNcbiAgICAgICAgfSwgci5fcmVtb3ZlID0gZnVuY3Rpb24gKHQsIGUpIHtcbiAgICAgICAgICAgIHJldHVybiB0LnRpbWVsaW5lID09PSB0aGlzICYmIChlIHx8IHQuX2VuYWJsZWQoITEsICEwKSwgdC50aW1lbGluZSA9IG51bGwsIHQuX3ByZXYgPyB0Ll9wcmV2Ll9uZXh0ID0gdC5fbmV4dCA6IHRoaXMuX2ZpcnN0ID09PSB0ICYmICh0aGlzLl9maXJzdCA9IHQuX25leHQpLCB0Ll9uZXh0ID8gdC5fbmV4dC5fcHJldiA9IHQuX3ByZXYgOiB0aGlzLl9sYXN0ID09PSB0ICYmICh0aGlzLl9sYXN0ID0gdC5fcHJldiksIHRoaXMuX3RpbWVsaW5lICYmIHRoaXMuX3VuY2FjaGUoITApKSwgdGhpc1xuICAgICAgICB9LCByLnJlbmRlciA9IGZ1bmN0aW9uICh0LCBlLCBpKSB7XG4gICAgICAgICAgICB2YXIgcywgciA9IHRoaXMuX2ZpcnN0O1xuICAgICAgICAgICAgZm9yICh0aGlzLl90b3RhbFRpbWUgPSB0aGlzLl90aW1lID0gdGhpcy5fcmF3UHJldlRpbWUgPSB0OyByOylzID0gci5fbmV4dCwgKHIuX2FjdGl2ZSB8fCB0ID49IHIuX3N0YXJ0VGltZSAmJiAhci5fcGF1c2VkKSAmJiAoci5fcmV2ZXJzZWQgPyByLnJlbmRlcigoci5fZGlydHkgPyByLnRvdGFsRHVyYXRpb24oKSA6IHIuX3RvdGFsRHVyYXRpb24pIC0gKHQgLSByLl9zdGFydFRpbWUpICogci5fdGltZVNjYWxlLCBlLCBpKSA6IHIucmVuZGVyKCh0IC0gci5fc3RhcnRUaW1lKSAqIHIuX3RpbWVTY2FsZSwgZSwgaSkpLCByID0gc1xuICAgICAgICB9LCByLnJhd1RpbWUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gYSB8fCBuLndha2UoKSwgdGhpcy5fdG90YWxUaW1lXG4gICAgICAgIH07XG4gICAgICAgIHZhciBEID0gZChcIlR3ZWVuTGl0ZVwiLCBmdW5jdGlvbiAoZSwgaSwgcykge1xuICAgICAgICAgICAgaWYgKHguY2FsbCh0aGlzLCBpLCBzKSwgdGhpcy5yZW5kZXIgPSBELnByb3RvdHlwZS5yZW5kZXIsIG51bGwgPT0gZSl0aHJvd1wiQ2Fubm90IHR3ZWVuIGEgbnVsbCB0YXJnZXQuXCI7XG4gICAgICAgICAgICB0aGlzLnRhcmdldCA9IGUgPSBcInN0cmluZ1wiICE9IHR5cGVvZiBlID8gZSA6IEQuc2VsZWN0b3IoZSkgfHwgZTtcbiAgICAgICAgICAgIHZhciByLCBuLCBhLCBvID0gZS5qcXVlcnkgfHwgZS5sZW5ndGggJiYgZSAhPT0gdCAmJiBlWzBdICYmIChlWzBdID09PSB0IHx8IGVbMF0ubm9kZVR5cGUgJiYgZVswXS5zdHlsZSAmJiAhZS5ub2RlVHlwZSksIGwgPSB0aGlzLnZhcnMub3ZlcndyaXRlO1xuICAgICAgICAgICAgaWYgKHRoaXMuX292ZXJ3cml0ZSA9IGwgPSBudWxsID09IGwgPyBqW0QuZGVmYXVsdE92ZXJ3cml0ZV0gOiBcIm51bWJlclwiID09IHR5cGVvZiBsID8gbCA+PiAwIDogaltsXSwgKG8gfHwgZSBpbnN0YW5jZW9mIEFycmF5IHx8IGUucHVzaCAmJiBtKGUpKSAmJiBcIm51bWJlclwiICE9IHR5cGVvZiBlWzBdKWZvciAodGhpcy5fdGFyZ2V0cyA9IGEgPSBfLmNhbGwoZSwgMCksIHRoaXMuX3Byb3BMb29rdXAgPSBbXSwgdGhpcy5fc2libGluZ3MgPSBbXSwgciA9IDA7IGEubGVuZ3RoID4gcjsgcisrKW4gPSBhW3JdLCBuID8gXCJzdHJpbmdcIiAhPSB0eXBlb2YgbiA/IG4ubGVuZ3RoICYmIG4gIT09IHQgJiYgblswXSAmJiAoblswXSA9PT0gdCB8fCBuWzBdLm5vZGVUeXBlICYmIG5bMF0uc3R5bGUgJiYgIW4ubm9kZVR5cGUpID8gKGEuc3BsaWNlKHItLSwgMSksIHRoaXMuX3RhcmdldHMgPSBhID0gYS5jb25jYXQoXy5jYWxsKG4sIDApKSkgOiAodGhpcy5fc2libGluZ3Nbcl0gPSBCKG4sIHRoaXMsICExKSwgMSA9PT0gbCAmJiB0aGlzLl9zaWJsaW5nc1tyXS5sZW5ndGggPiAxICYmIHEobiwgdGhpcywgbnVsbCwgMSwgdGhpcy5fc2libGluZ3Nbcl0pKSA6IChuID0gYVtyLS1dID0gRC5zZWxlY3RvcihuKSwgXCJzdHJpbmdcIiA9PSB0eXBlb2YgbiAmJiBhLnNwbGljZShyICsgMSwgMSkpIDogYS5zcGxpY2Uoci0tLCAxKTsgZWxzZSB0aGlzLl9wcm9wTG9va3VwID0ge30sIHRoaXMuX3NpYmxpbmdzID0gQihlLCB0aGlzLCAhMSksIDEgPT09IGwgJiYgdGhpcy5fc2libGluZ3MubGVuZ3RoID4gMSAmJiBxKGUsIHRoaXMsIG51bGwsIDEsIHRoaXMuX3NpYmxpbmdzKTtcbiAgICAgICAgICAgICh0aGlzLnZhcnMuaW1tZWRpYXRlUmVuZGVyIHx8IDAgPT09IGkgJiYgMCA9PT0gdGhpcy5fZGVsYXkgJiYgdGhpcy52YXJzLmltbWVkaWF0ZVJlbmRlciAhPT0gITEpICYmIHRoaXMucmVuZGVyKC10aGlzLl9kZWxheSwgITEsICEwKVxuICAgICAgICB9LCAhMCksIEUgPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgcmV0dXJuIGUubGVuZ3RoICYmIGUgIT09IHQgJiYgZVswXSAmJiAoZVswXSA9PT0gdCB8fCBlWzBdLm5vZGVUeXBlICYmIGVbMF0uc3R5bGUgJiYgIWUubm9kZVR5cGUpXG4gICAgICAgIH0sIEkgPSBmdW5jdGlvbiAodCwgZSkge1xuICAgICAgICAgICAgdmFyIGksIHMgPSB7fTtcbiAgICAgICAgICAgIGZvciAoaSBpbiB0KUZbaV0gfHwgaSBpbiBlICYmIFwieFwiICE9PSBpICYmIFwieVwiICE9PSBpICYmIFwid2lkdGhcIiAhPT0gaSAmJiBcImhlaWdodFwiICE9PSBpICYmIFwiY2xhc3NOYW1lXCIgIT09IGkgJiYgXCJib3JkZXJcIiAhPT0gaSB8fCAhKCFOW2ldIHx8IE5baV0gJiYgTltpXS5fYXV0b0NTUykgfHwgKHNbaV0gPSB0W2ldLCBkZWxldGUgdFtpXSk7XG4gICAgICAgICAgICB0LmNzcyA9IHNcbiAgICAgICAgfTtcbiAgICAgICAgciA9IEQucHJvdG90eXBlID0gbmV3IHgsIHIuY29uc3RydWN0b3IgPSBELCByLmtpbGwoKS5fZ2MgPSAhMSwgci5yYXRpbyA9IDAsIHIuX2ZpcnN0UFQgPSByLl90YXJnZXRzID0gci5fb3ZlcndyaXR0ZW5Qcm9wcyA9IHIuX3N0YXJ0QXQgPSBudWxsLCByLl9ub3RpZnlQbHVnaW5zT2ZFbmFibGVkID0gITEsIEQudmVyc2lvbiA9IFwiMS4xMS4xXCIsIEQuZGVmYXVsdEVhc2UgPSByLl9lYXNlID0gbmV3IFQobnVsbCwgbnVsbCwgMSwgMSksIEQuZGVmYXVsdE92ZXJ3cml0ZSA9IFwiYXV0b1wiLCBELnRpY2tlciA9IG4sIEQuYXV0b1NsZWVwID0gITAsIEQuc2VsZWN0b3IgPSB0LiQgfHwgdC5qUXVlcnkgfHwgZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgIHJldHVybiB0LiQgPyAoRC5zZWxlY3RvciA9IHQuJCwgdC4kKGUpKSA6IHQuZG9jdW1lbnQgPyB0LmRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiI1wiID09PSBlLmNoYXJBdCgwKSA/IGUuc3Vic3RyKDEpIDogZSkgOiBlXG4gICAgICAgIH07XG4gICAgICAgIHZhciBPID0gRC5faW50ZXJuYWxzID0ge2lzQXJyYXk6IG0sIGlzU2VsZWN0b3I6IEV9LCBOID0gRC5fcGx1Z2lucyA9IHt9LCBMID0gRC5fdHdlZW5Mb29rdXAgPSB7fSwgVSA9IDAsIEYgPSBPLnJlc2VydmVkUHJvcHMgPSB7ZWFzZTogMSwgZGVsYXk6IDEsIG92ZXJ3cml0ZTogMSwgb25Db21wbGV0ZTogMSwgb25Db21wbGV0ZVBhcmFtczogMSwgb25Db21wbGV0ZVNjb3BlOiAxLCB1c2VGcmFtZXM6IDEsIHJ1bkJhY2t3YXJkczogMSwgc3RhcnRBdDogMSwgb25VcGRhdGU6IDEsIG9uVXBkYXRlUGFyYW1zOiAxLCBvblVwZGF0ZVNjb3BlOiAxLCBvblN0YXJ0OiAxLCBvblN0YXJ0UGFyYW1zOiAxLCBvblN0YXJ0U2NvcGU6IDEsIG9uUmV2ZXJzZUNvbXBsZXRlOiAxLCBvblJldmVyc2VDb21wbGV0ZVBhcmFtczogMSwgb25SZXZlcnNlQ29tcGxldGVTY29wZTogMSwgb25SZXBlYXQ6IDEsIG9uUmVwZWF0UGFyYW1zOiAxLCBvblJlcGVhdFNjb3BlOiAxLCBlYXNlUGFyYW1zOiAxLCB5b3lvOiAxLCBpbW1lZGlhdGVSZW5kZXI6IDEsIHJlcGVhdDogMSwgcmVwZWF0RGVsYXk6IDEsIGRhdGE6IDEsIHBhdXNlZDogMSwgcmV2ZXJzZWQ6IDEsIGF1dG9DU1M6IDF9LCBqID0ge25vbmU6IDAsIGFsbDogMSwgYXV0bzogMiwgY29uY3VycmVudDogMywgYWxsT25TdGFydDogNCwgcHJlZXhpc3Rpbmc6IDUsIFwidHJ1ZVwiOiAxLCBcImZhbHNlXCI6IDB9LCBHID0geC5fcm9vdEZyYW1lc1RpbWVsaW5lID0gbmV3IFIsIFEgPSB4Ll9yb290VGltZWxpbmUgPSBuZXcgUjtcbiAgICAgICAgUS5fc3RhcnRUaW1lID0gbi50aW1lLCBHLl9zdGFydFRpbWUgPSBuLmZyYW1lLCBRLl9hY3RpdmUgPSBHLl9hY3RpdmUgPSAhMCwgeC5fdXBkYXRlUm9vdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmIChRLnJlbmRlcigobi50aW1lIC0gUS5fc3RhcnRUaW1lKSAqIFEuX3RpbWVTY2FsZSwgITEsICExKSwgRy5yZW5kZXIoKG4uZnJhbWUgLSBHLl9zdGFydFRpbWUpICogRy5fdGltZVNjYWxlLCAhMSwgITEpLCAhKG4uZnJhbWUgJSAxMjApKSB7XG4gICAgICAgICAgICAgICAgdmFyIHQsIGUsIGk7XG4gICAgICAgICAgICAgICAgZm9yIChpIGluIEwpIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChlID0gTFtpXS50d2VlbnMsIHQgPSBlLmxlbmd0aDsgLS10ID4gLTE7KWVbdF0uX2djICYmIGUuc3BsaWNlKHQsIDEpO1xuICAgICAgICAgICAgICAgICAgICAwID09PSBlLmxlbmd0aCAmJiBkZWxldGUgTFtpXVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoaSA9IFEuX2ZpcnN0LCAoIWkgfHwgaS5fcGF1c2VkKSAmJiBELmF1dG9TbGVlcCAmJiAhRy5fZmlyc3QgJiYgMSA9PT0gbi5fbGlzdGVuZXJzLnRpY2subGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgIGZvciAoOyBpICYmIGkuX3BhdXNlZDspaSA9IGkuX25leHQ7XG4gICAgICAgICAgICAgICAgICAgIGkgfHwgbi5zbGVlcCgpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9LCBuLmFkZEV2ZW50TGlzdGVuZXIoXCJ0aWNrXCIsIHguX3VwZGF0ZVJvb3QpO1xuICAgICAgICB2YXIgQiA9IGZ1bmN0aW9uICh0LCBlLCBpKSB7XG4gICAgICAgICAgICB2YXIgcywgciwgbiA9IHQuX2dzVHdlZW5JRDtcbiAgICAgICAgICAgIGlmIChMW24gfHwgKHQuX2dzVHdlZW5JRCA9IG4gPSBcInRcIiArIFUrKyldIHx8IChMW25dID0ge3RhcmdldDogdCwgdHdlZW5zOiBbXX0pLCBlICYmIChzID0gTFtuXS50d2VlbnMsIHNbciA9IHMubGVuZ3RoXSA9IGUsIGkpKWZvciAoOyAtLXIgPiAtMTspc1tyXSA9PT0gZSAmJiBzLnNwbGljZShyLCAxKTtcbiAgICAgICAgICAgIHJldHVybiBMW25dLnR3ZWVuc1xuICAgICAgICB9LCBxID0gZnVuY3Rpb24gKHQsIGUsIGksIHMsIHIpIHtcbiAgICAgICAgICAgIHZhciBuLCBhLCBvLCBsO1xuICAgICAgICAgICAgaWYgKDEgPT09IHMgfHwgcyA+PSA0KSB7XG4gICAgICAgICAgICAgICAgZm9yIChsID0gci5sZW5ndGgsIG4gPSAwOyBsID4gbjsgbisrKWlmICgobyA9IHJbbl0pICE9PSBlKW8uX2djIHx8IG8uX2VuYWJsZWQoITEsICExKSAmJiAoYSA9ICEwKTsgZWxzZSBpZiAoNSA9PT0gcylicmVhaztcbiAgICAgICAgICAgICAgICByZXR1cm4gYVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIF8sIHUgPSBlLl9zdGFydFRpbWUgKyBoLCBtID0gW10sIGYgPSAwLCBwID0gMCA9PT0gZS5fZHVyYXRpb247XG4gICAgICAgICAgICBmb3IgKG4gPSByLmxlbmd0aDsgLS1uID4gLTE7KShvID0gcltuXSkgPT09IGUgfHwgby5fZ2MgfHwgby5fcGF1c2VkIHx8IChvLl90aW1lbGluZSAhPT0gZS5fdGltZWxpbmUgPyAoXyA9IF8gfHwgJChlLCAwLCBwKSwgMCA9PT0gJChvLCBfLCBwKSAmJiAobVtmKytdID0gbykpIDogdSA+PSBvLl9zdGFydFRpbWUgJiYgby5fc3RhcnRUaW1lICsgby50b3RhbER1cmF0aW9uKCkgLyBvLl90aW1lU2NhbGUgKyBoID4gdSAmJiAoKHAgfHwgIW8uX2luaXR0ZWQpICYmIDJlLTEwID49IHUgLSBvLl9zdGFydFRpbWUgfHwgKG1bZisrXSA9IG8pKSk7XG4gICAgICAgICAgICBmb3IgKG4gPSBmOyAtLW4gPiAtMTspbyA9IG1bbl0sIDIgPT09IHMgJiYgby5fa2lsbChpLCB0KSAmJiAoYSA9ICEwKSwgKDIgIT09IHMgfHwgIW8uX2ZpcnN0UFQgJiYgby5faW5pdHRlZCkgJiYgby5fZW5hYmxlZCghMSwgITEpICYmIChhID0gITApO1xuICAgICAgICAgICAgcmV0dXJuIGFcbiAgICAgICAgfSwgJCA9IGZ1bmN0aW9uICh0LCBlLCBpKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBzID0gdC5fdGltZWxpbmUsIHIgPSBzLl90aW1lU2NhbGUsIG4gPSB0Ll9zdGFydFRpbWU7IHMuX3RpbWVsaW5lOykge1xuICAgICAgICAgICAgICAgIGlmIChuICs9IHMuX3N0YXJ0VGltZSwgciAqPSBzLl90aW1lU2NhbGUsIHMuX3BhdXNlZClyZXR1cm4tMTAwO1xuICAgICAgICAgICAgICAgIHMgPSBzLl90aW1lbGluZVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIG4gLz0gciwgbiA+IGUgPyBuIC0gZSA6IGkgJiYgbiA9PT0gZSB8fCAhdC5faW5pdHRlZCAmJiAyICogaCA+IG4gLSBlID8gaCA6IChuICs9IHQudG90YWxEdXJhdGlvbigpIC8gdC5fdGltZVNjYWxlIC8gcikgPiBlICsgaCA/IDAgOiBuIC0gZSAtIGhcbiAgICAgICAgfTtcbiAgICAgICAgci5faW5pdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciB0LCBlLCBpLCBzLCByID0gdGhpcy52YXJzLCBuID0gdGhpcy5fb3ZlcndyaXR0ZW5Qcm9wcywgYSA9IHRoaXMuX2R1cmF0aW9uLCBvID0gci5pbW1lZGlhdGVSZW5kZXIsIGwgPSByLmVhc2U7XG4gICAgICAgICAgICBpZiAoci5zdGFydEF0KSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuX3N0YXJ0QXQgJiYgdGhpcy5fc3RhcnRBdC5yZW5kZXIoLTEsICEwKSwgci5zdGFydEF0Lm92ZXJ3cml0ZSA9IDAsIHIuc3RhcnRBdC5pbW1lZGlhdGVSZW5kZXIgPSAhMCwgdGhpcy5fc3RhcnRBdCA9IEQudG8odGhpcy50YXJnZXQsIDAsIHIuc3RhcnRBdCksIG8paWYgKHRoaXMuX3RpbWUgPiAwKXRoaXMuX3N0YXJ0QXQgPSBudWxsOyBlbHNlIGlmICgwICE9PSBhKXJldHVyblxuICAgICAgICAgICAgfSBlbHNlIGlmIChyLnJ1bkJhY2t3YXJkcyAmJiAwICE9PSBhKWlmICh0aGlzLl9zdGFydEF0KXRoaXMuX3N0YXJ0QXQucmVuZGVyKC0xLCAhMCksIHRoaXMuX3N0YXJ0QXQgPSBudWxsOyBlbHNlIHtcbiAgICAgICAgICAgICAgICBpID0ge307XG4gICAgICAgICAgICAgICAgZm9yIChzIGluIHIpRltzXSAmJiBcImF1dG9DU1NcIiAhPT0gcyB8fCAoaVtzXSA9IHJbc10pO1xuICAgICAgICAgICAgICAgIGlmIChpLm92ZXJ3cml0ZSA9IDAsIGkuZGF0YSA9IFwiaXNGcm9tU3RhcnRcIiwgdGhpcy5fc3RhcnRBdCA9IEQudG8odGhpcy50YXJnZXQsIDAsIGkpLCByLmltbWVkaWF0ZVJlbmRlcikge1xuICAgICAgICAgICAgICAgICAgICBpZiAoMCA9PT0gdGhpcy5fdGltZSlyZXR1cm5cbiAgICAgICAgICAgICAgICB9IGVsc2UgdGhpcy5fc3RhcnRBdC5yZW5kZXIoLTEsICEwKVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHRoaXMuX2Vhc2UgPSBsID8gbCBpbnN0YW5jZW9mIFQgPyByLmVhc2VQYXJhbXMgaW5zdGFuY2VvZiBBcnJheSA/IGwuY29uZmlnLmFwcGx5KGwsIHIuZWFzZVBhcmFtcykgOiBsIDogXCJmdW5jdGlvblwiID09IHR5cGVvZiBsID8gbmV3IFQobCwgci5lYXNlUGFyYW1zKSA6IHdbbF0gfHwgRC5kZWZhdWx0RWFzZSA6IEQuZGVmYXVsdEVhc2UsIHRoaXMuX2Vhc2VUeXBlID0gdGhpcy5fZWFzZS5fdHlwZSwgdGhpcy5fZWFzZVBvd2VyID0gdGhpcy5fZWFzZS5fcG93ZXIsIHRoaXMuX2ZpcnN0UFQgPSBudWxsLCB0aGlzLl90YXJnZXRzKWZvciAodCA9IHRoaXMuX3RhcmdldHMubGVuZ3RoOyAtLXQgPiAtMTspdGhpcy5faW5pdFByb3BzKHRoaXMuX3RhcmdldHNbdF0sIHRoaXMuX3Byb3BMb29rdXBbdF0gPSB7fSwgdGhpcy5fc2libGluZ3NbdF0sIG4gPyBuW3RdIDogbnVsbCkgJiYgKGUgPSAhMCk7IGVsc2UgZSA9IHRoaXMuX2luaXRQcm9wcyh0aGlzLnRhcmdldCwgdGhpcy5fcHJvcExvb2t1cCwgdGhpcy5fc2libGluZ3MsIG4pO1xuICAgICAgICAgICAgaWYgKGUgJiYgRC5fb25QbHVnaW5FdmVudChcIl9vbkluaXRBbGxQcm9wc1wiLCB0aGlzKSwgbiAmJiAodGhpcy5fZmlyc3RQVCB8fCBcImZ1bmN0aW9uXCIgIT0gdHlwZW9mIHRoaXMudGFyZ2V0ICYmIHRoaXMuX2VuYWJsZWQoITEsICExKSksIHIucnVuQmFja3dhcmRzKWZvciAoaSA9IHRoaXMuX2ZpcnN0UFQ7IGk7KWkucyArPSBpLmMsIGkuYyA9IC1pLmMsIGkgPSBpLl9uZXh0O1xuICAgICAgICAgICAgdGhpcy5fb25VcGRhdGUgPSByLm9uVXBkYXRlLCB0aGlzLl9pbml0dGVkID0gITBcbiAgICAgICAgfSwgci5faW5pdFByb3BzID0gZnVuY3Rpb24gKGUsIGksIHMsIHIpIHtcbiAgICAgICAgICAgIHZhciBuLCBhLCBvLCBsLCBoLCBfO1xuICAgICAgICAgICAgaWYgKG51bGwgPT0gZSlyZXR1cm4hMTtcbiAgICAgICAgICAgIHRoaXMudmFycy5jc3MgfHwgZS5zdHlsZSAmJiBlICE9PSB0ICYmIGUubm9kZVR5cGUgJiYgTi5jc3MgJiYgdGhpcy52YXJzLmF1dG9DU1MgIT09ICExICYmIEkodGhpcy52YXJzLCBlKTtcbiAgICAgICAgICAgIGZvciAobiBpbiB0aGlzLnZhcnMpIHtcbiAgICAgICAgICAgICAgICBpZiAoXyA9IHRoaXMudmFyc1tuXSwgRltuXSlfICYmIChfIGluc3RhbmNlb2YgQXJyYXkgfHwgXy5wdXNoICYmIG0oXykpICYmIC0xICE9PSBfLmpvaW4oXCJcIikuaW5kZXhPZihcIntzZWxmfVwiKSAmJiAodGhpcy52YXJzW25dID0gXyA9IHRoaXMuX3N3YXBTZWxmSW5QYXJhbXMoXywgdGhpcykpOyBlbHNlIGlmIChOW25dICYmIChsID0gbmV3IE5bbl0pLl9vbkluaXRUd2VlbihlLCB0aGlzLnZhcnNbbl0sIHRoaXMpKSB7XG4gICAgICAgICAgICAgICAgICAgIGZvciAodGhpcy5fZmlyc3RQVCA9IGggPSB7X25leHQ6IHRoaXMuX2ZpcnN0UFQsIHQ6IGwsIHA6IFwic2V0UmF0aW9cIiwgczogMCwgYzogMSwgZjogITAsIG46IG4sIHBnOiAhMCwgcHI6IGwuX3ByaW9yaXR5fSwgYSA9IGwuX292ZXJ3cml0ZVByb3BzLmxlbmd0aDsgLS1hID4gLTE7KWlbbC5fb3ZlcndyaXRlUHJvcHNbYV1dID0gdGhpcy5fZmlyc3RQVDtcbiAgICAgICAgICAgICAgICAgICAgKGwuX3ByaW9yaXR5IHx8IGwuX29uSW5pdEFsbFByb3BzKSAmJiAobyA9ICEwKSwgKGwuX29uRGlzYWJsZSB8fCBsLl9vbkVuYWJsZSkgJiYgKHRoaXMuX25vdGlmeVBsdWdpbnNPZkVuYWJsZWQgPSAhMClcbiAgICAgICAgICAgICAgICB9IGVsc2UgdGhpcy5fZmlyc3RQVCA9IGlbbl0gPSBoID0ge19uZXh0OiB0aGlzLl9maXJzdFBULCB0OiBlLCBwOiBuLCBmOiBcImZ1bmN0aW9uXCIgPT0gdHlwZW9mIGVbbl0sIG46IG4sIHBnOiAhMSwgcHI6IDB9LCBoLnMgPSBoLmYgPyBlW24uaW5kZXhPZihcInNldFwiKSB8fCBcImZ1bmN0aW9uXCIgIT0gdHlwZW9mIGVbXCJnZXRcIiArIG4uc3Vic3RyKDMpXSA/IG4gOiBcImdldFwiICsgbi5zdWJzdHIoMyldKCkgOiBwYXJzZUZsb2F0KGVbbl0pLCBoLmMgPSBcInN0cmluZ1wiID09IHR5cGVvZiBfICYmIFwiPVwiID09PSBfLmNoYXJBdCgxKSA/IHBhcnNlSW50KF8uY2hhckF0KDApICsgXCIxXCIsIDEwKSAqIE51bWJlcihfLnN1YnN0cigyKSkgOiBOdW1iZXIoXykgLSBoLnMgfHwgMDtcbiAgICAgICAgICAgICAgICBoICYmIGguX25leHQgJiYgKGguX25leHQuX3ByZXYgPSBoKVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHIgJiYgdGhpcy5fa2lsbChyLCBlKSA/IHRoaXMuX2luaXRQcm9wcyhlLCBpLCBzLCByKSA6IHRoaXMuX292ZXJ3cml0ZSA+IDEgJiYgdGhpcy5fZmlyc3RQVCAmJiBzLmxlbmd0aCA+IDEgJiYgcShlLCB0aGlzLCBpLCB0aGlzLl9vdmVyd3JpdGUsIHMpID8gKHRoaXMuX2tpbGwoaSwgZSksIHRoaXMuX2luaXRQcm9wcyhlLCBpLCBzLCByKSkgOiBvXG4gICAgICAgIH0sIHIucmVuZGVyID0gZnVuY3Rpb24gKHQsIGUsIGkpIHtcbiAgICAgICAgICAgIHZhciBzLCByLCBuLCBhLCBvID0gdGhpcy5fdGltZSwgbCA9IHRoaXMuX2R1cmF0aW9uO1xuICAgICAgICAgICAgaWYgKHQgPj0gbCl0aGlzLl90b3RhbFRpbWUgPSB0aGlzLl90aW1lID0gbCwgdGhpcy5yYXRpbyA9IHRoaXMuX2Vhc2UuX2NhbGNFbmQgPyB0aGlzLl9lYXNlLmdldFJhdGlvKDEpIDogMSwgdGhpcy5fcmV2ZXJzZWQgfHwgKHMgPSAhMCwgciA9IFwib25Db21wbGV0ZVwiKSwgMCA9PT0gbCAmJiAoYSA9IHRoaXMuX3Jhd1ByZXZUaW1lLCAoMCA9PT0gdCB8fCAwID4gYSB8fCBhID09PSBoKSAmJiBhICE9PSB0ICYmIChpID0gITAsIGEgPiBoICYmIChyID0gXCJvblJldmVyc2VDb21wbGV0ZVwiKSksIHRoaXMuX3Jhd1ByZXZUaW1lID0gYSA9ICFlIHx8IHQgPyB0IDogaCk7IGVsc2UgaWYgKDFlLTcgPiB0KXRoaXMuX3RvdGFsVGltZSA9IHRoaXMuX3RpbWUgPSAwLCB0aGlzLnJhdGlvID0gdGhpcy5fZWFzZS5fY2FsY0VuZCA/IHRoaXMuX2Vhc2UuZ2V0UmF0aW8oMCkgOiAwLCAoMCAhPT0gbyB8fCAwID09PSBsICYmIHRoaXMuX3Jhd1ByZXZUaW1lID4gaCkgJiYgKHIgPSBcIm9uUmV2ZXJzZUNvbXBsZXRlXCIsIHMgPSB0aGlzLl9yZXZlcnNlZCksIDAgPiB0ID8gKHRoaXMuX2FjdGl2ZSA9ICExLCAwID09PSBsICYmICh0aGlzLl9yYXdQcmV2VGltZSA+PSAwICYmIChpID0gITApLCB0aGlzLl9yYXdQcmV2VGltZSA9IGEgPSAhZSB8fCB0ID8gdCA6IGgpKSA6IHRoaXMuX2luaXR0ZWQgfHwgKGkgPSAhMCk7IGVsc2UgaWYgKHRoaXMuX3RvdGFsVGltZSA9IHRoaXMuX3RpbWUgPSB0LCB0aGlzLl9lYXNlVHlwZSkge1xuICAgICAgICAgICAgICAgIHZhciBfID0gdCAvIGwsIHUgPSB0aGlzLl9lYXNlVHlwZSwgbSA9IHRoaXMuX2Vhc2VQb3dlcjtcbiAgICAgICAgICAgICAgICAoMSA9PT0gdSB8fCAzID09PSB1ICYmIF8gPj0gLjUpICYmIChfID0gMSAtIF8pLCAzID09PSB1ICYmIChfICo9IDIpLCAxID09PSBtID8gXyAqPSBfIDogMiA9PT0gbSA/IF8gKj0gXyAqIF8gOiAzID09PSBtID8gXyAqPSBfICogXyAqIF8gOiA0ID09PSBtICYmIChfICo9IF8gKiBfICogXyAqIF8pLCB0aGlzLnJhdGlvID0gMSA9PT0gdSA/IDEgLSBfIDogMiA9PT0gdSA/IF8gOiAuNSA+IHQgLyBsID8gXyAvIDIgOiAxIC0gXyAvIDJcbiAgICAgICAgICAgIH0gZWxzZSB0aGlzLnJhdGlvID0gdGhpcy5fZWFzZS5nZXRSYXRpbyh0IC8gbCk7XG4gICAgICAgICAgICBpZiAodGhpcy5fdGltZSAhPT0gbyB8fCBpKSB7XG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLl9pbml0dGVkKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLl9pbml0KCksICF0aGlzLl9pbml0dGVkIHx8IHRoaXMuX2djKXJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fdGltZSAmJiAhcyA/IHRoaXMucmF0aW8gPSB0aGlzLl9lYXNlLmdldFJhdGlvKHRoaXMuX3RpbWUgLyBsKSA6IHMgJiYgdGhpcy5fZWFzZS5fY2FsY0VuZCAmJiAodGhpcy5yYXRpbyA9IHRoaXMuX2Vhc2UuZ2V0UmF0aW8oMCA9PT0gdGhpcy5fdGltZSA/IDAgOiAxKSlcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZm9yICh0aGlzLl9hY3RpdmUgfHwgIXRoaXMuX3BhdXNlZCAmJiB0aGlzLl90aW1lICE9PSBvICYmIHQgPj0gMCAmJiAodGhpcy5fYWN0aXZlID0gITApLCAwID09PSBvICYmICh0aGlzLl9zdGFydEF0ICYmICh0ID49IDAgPyB0aGlzLl9zdGFydEF0LnJlbmRlcih0LCBlLCBpKSA6IHIgfHwgKHIgPSBcIl9kdW1teUdTXCIpKSwgdGhpcy52YXJzLm9uU3RhcnQgJiYgKDAgIT09IHRoaXMuX3RpbWUgfHwgMCA9PT0gbCkgJiYgKGUgfHwgdGhpcy52YXJzLm9uU3RhcnQuYXBwbHkodGhpcy52YXJzLm9uU3RhcnRTY29wZSB8fCB0aGlzLCB0aGlzLnZhcnMub25TdGFydFBhcmFtcyB8fCBnKSkpLCBuID0gdGhpcy5fZmlyc3RQVDsgbjspbi5mID8gbi50W24ucF0obi5jICogdGhpcy5yYXRpbyArIG4ucykgOiBuLnRbbi5wXSA9IG4uYyAqIHRoaXMucmF0aW8gKyBuLnMsIG4gPSBuLl9uZXh0O1xuICAgICAgICAgICAgICAgIHRoaXMuX29uVXBkYXRlICYmICgwID4gdCAmJiB0aGlzLl9zdGFydEF0ICYmIHRoaXMuX3N0YXJ0VGltZSAmJiB0aGlzLl9zdGFydEF0LnJlbmRlcih0LCBlLCBpKSwgZSB8fCBpICYmIDAgPT09IHRoaXMuX3RpbWUgJiYgMCA9PT0gbyB8fCB0aGlzLl9vblVwZGF0ZS5hcHBseSh0aGlzLnZhcnMub25VcGRhdGVTY29wZSB8fCB0aGlzLCB0aGlzLnZhcnMub25VcGRhdGVQYXJhbXMgfHwgZykpLCByICYmICh0aGlzLl9nYyB8fCAoMCA+IHQgJiYgdGhpcy5fc3RhcnRBdCAmJiAhdGhpcy5fb25VcGRhdGUgJiYgdGhpcy5fc3RhcnRUaW1lICYmIHRoaXMuX3N0YXJ0QXQucmVuZGVyKHQsIGUsIGkpLCBzICYmICh0aGlzLl90aW1lbGluZS5hdXRvUmVtb3ZlQ2hpbGRyZW4gJiYgdGhpcy5fZW5hYmxlZCghMSwgITEpLCB0aGlzLl9hY3RpdmUgPSAhMSksICFlICYmIHRoaXMudmFyc1tyXSAmJiB0aGlzLnZhcnNbcl0uYXBwbHkodGhpcy52YXJzW3IgKyBcIlNjb3BlXCJdIHx8IHRoaXMsIHRoaXMudmFyc1tyICsgXCJQYXJhbXNcIl0gfHwgZyksIDAgPT09IGwgJiYgdGhpcy5fcmF3UHJldlRpbWUgPT09IGggJiYgYSAhPT0gaCAmJiAodGhpcy5fcmF3UHJldlRpbWUgPSAwKSkpXG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIHIuX2tpbGwgPSBmdW5jdGlvbiAodCwgZSkge1xuICAgICAgICAgICAgaWYgKFwiYWxsXCIgPT09IHQgJiYgKHQgPSBudWxsKSwgbnVsbCA9PSB0ICYmIChudWxsID09IGUgfHwgZSA9PT0gdGhpcy50YXJnZXQpKXJldHVybiB0aGlzLl9lbmFibGVkKCExLCAhMSk7XG4gICAgICAgICAgICBlID0gXCJzdHJpbmdcIiAhPSB0eXBlb2YgZSA/IGUgfHwgdGhpcy5fdGFyZ2V0cyB8fCB0aGlzLnRhcmdldCA6IEQuc2VsZWN0b3IoZSkgfHwgZTtcbiAgICAgICAgICAgIHZhciBpLCBzLCByLCBuLCBhLCBvLCBsLCBoO1xuICAgICAgICAgICAgaWYgKChtKGUpIHx8IEUoZSkpICYmIFwibnVtYmVyXCIgIT0gdHlwZW9mIGVbMF0pZm9yIChpID0gZS5sZW5ndGg7IC0taSA+IC0xOyl0aGlzLl9raWxsKHQsIGVbaV0pICYmIChvID0gITApOyBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5fdGFyZ2V0cykge1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGkgPSB0aGlzLl90YXJnZXRzLmxlbmd0aDsgLS1pID4gLTE7KWlmIChlID09PSB0aGlzLl90YXJnZXRzW2ldKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhID0gdGhpcy5fcHJvcExvb2t1cFtpXSB8fCB7fSwgdGhpcy5fb3ZlcndyaXR0ZW5Qcm9wcyA9IHRoaXMuX292ZXJ3cml0dGVuUHJvcHMgfHwgW10sIHMgPSB0aGlzLl9vdmVyd3JpdHRlblByb3BzW2ldID0gdCA/IHRoaXMuX292ZXJ3cml0dGVuUHJvcHNbaV0gfHwge30gOiBcImFsbFwiO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChlICE9PSB0aGlzLnRhcmdldClyZXR1cm4hMTtcbiAgICAgICAgICAgICAgICAgICAgYSA9IHRoaXMuX3Byb3BMb29rdXAsIHMgPSB0aGlzLl9vdmVyd3JpdHRlblByb3BzID0gdCA/IHRoaXMuX292ZXJ3cml0dGVuUHJvcHMgfHwge30gOiBcImFsbFwiXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChhKSB7XG4gICAgICAgICAgICAgICAgICAgIGwgPSB0IHx8IGEsIGggPSB0ICE9PSBzICYmIFwiYWxsXCIgIT09IHMgJiYgdCAhPT0gYSAmJiAoXCJvYmplY3RcIiAhPSB0eXBlb2YgdCB8fCAhdC5fdGVtcEtpbGwpO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKHIgaW4gbCkobiA9IGFbcl0pICYmIChuLnBnICYmIG4udC5fa2lsbChsKSAmJiAobyA9ICEwKSwgbi5wZyAmJiAwICE9PSBuLnQuX292ZXJ3cml0ZVByb3BzLmxlbmd0aCB8fCAobi5fcHJldiA/IG4uX3ByZXYuX25leHQgPSBuLl9uZXh0IDogbiA9PT0gdGhpcy5fZmlyc3RQVCAmJiAodGhpcy5fZmlyc3RQVCA9IG4uX25leHQpLCBuLl9uZXh0ICYmIChuLl9uZXh0Ll9wcmV2ID0gbi5fcHJldiksIG4uX25leHQgPSBuLl9wcmV2ID0gbnVsbCksIGRlbGV0ZSBhW3JdKSwgaCAmJiAoc1tyXSA9IDEpO1xuICAgICAgICAgICAgICAgICAgICAhdGhpcy5fZmlyc3RQVCAmJiB0aGlzLl9pbml0dGVkICYmIHRoaXMuX2VuYWJsZWQoITEsICExKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBvXG4gICAgICAgIH0sIHIuaW52YWxpZGF0ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9ub3RpZnlQbHVnaW5zT2ZFbmFibGVkICYmIEQuX29uUGx1Z2luRXZlbnQoXCJfb25EaXNhYmxlXCIsIHRoaXMpLCB0aGlzLl9maXJzdFBUID0gbnVsbCwgdGhpcy5fb3ZlcndyaXR0ZW5Qcm9wcyA9IG51bGwsIHRoaXMuX29uVXBkYXRlID0gbnVsbCwgdGhpcy5fc3RhcnRBdCA9IG51bGwsIHRoaXMuX2luaXR0ZWQgPSB0aGlzLl9hY3RpdmUgPSB0aGlzLl9ub3RpZnlQbHVnaW5zT2ZFbmFibGVkID0gITEsIHRoaXMuX3Byb3BMb29rdXAgPSB0aGlzLl90YXJnZXRzID8ge30gOiBbXSwgdGhpc1xuICAgICAgICB9LCByLl9lbmFibGVkID0gZnVuY3Rpb24gKHQsIGUpIHtcbiAgICAgICAgICAgIGlmIChhIHx8IG4ud2FrZSgpLCB0ICYmIHRoaXMuX2djKSB7XG4gICAgICAgICAgICAgICAgdmFyIGksIHMgPSB0aGlzLl90YXJnZXRzO1xuICAgICAgICAgICAgICAgIGlmIChzKWZvciAoaSA9IHMubGVuZ3RoOyAtLWkgPiAtMTspdGhpcy5fc2libGluZ3NbaV0gPSBCKHNbaV0sIHRoaXMsICEwKTsgZWxzZSB0aGlzLl9zaWJsaW5ncyA9IEIodGhpcy50YXJnZXQsIHRoaXMsICEwKVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHgucHJvdG90eXBlLl9lbmFibGVkLmNhbGwodGhpcywgdCwgZSksIHRoaXMuX25vdGlmeVBsdWdpbnNPZkVuYWJsZWQgJiYgdGhpcy5fZmlyc3RQVCA/IEQuX29uUGx1Z2luRXZlbnQodCA/IFwiX29uRW5hYmxlXCIgOiBcIl9vbkRpc2FibGVcIiwgdGhpcykgOiAhMVxuICAgICAgICB9LCBELnRvID0gZnVuY3Rpb24gKHQsIGUsIGkpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgRCh0LCBlLCBpKVxuICAgICAgICB9LCBELmZyb20gPSBmdW5jdGlvbiAodCwgZSwgaSkge1xuICAgICAgICAgICAgcmV0dXJuIGkucnVuQmFja3dhcmRzID0gITAsIGkuaW1tZWRpYXRlUmVuZGVyID0gMCAhPSBpLmltbWVkaWF0ZVJlbmRlciwgbmV3IEQodCwgZSwgaSlcbiAgICAgICAgfSwgRC5mcm9tVG8gPSBmdW5jdGlvbiAodCwgZSwgaSwgcykge1xuICAgICAgICAgICAgcmV0dXJuIHMuc3RhcnRBdCA9IGksIHMuaW1tZWRpYXRlUmVuZGVyID0gMCAhPSBzLmltbWVkaWF0ZVJlbmRlciAmJiAwICE9IGkuaW1tZWRpYXRlUmVuZGVyLCBuZXcgRCh0LCBlLCBzKVxuICAgICAgICB9LCBELmRlbGF5ZWRDYWxsID0gZnVuY3Rpb24gKHQsIGUsIGksIHMsIHIpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgRChlLCAwLCB7ZGVsYXk6IHQsIG9uQ29tcGxldGU6IGUsIG9uQ29tcGxldGVQYXJhbXM6IGksIG9uQ29tcGxldGVTY29wZTogcywgb25SZXZlcnNlQ29tcGxldGU6IGUsIG9uUmV2ZXJzZUNvbXBsZXRlUGFyYW1zOiBpLCBvblJldmVyc2VDb21wbGV0ZVNjb3BlOiBzLCBpbW1lZGlhdGVSZW5kZXI6ICExLCB1c2VGcmFtZXM6IHIsIG92ZXJ3cml0ZTogMH0pXG4gICAgICAgIH0sIEQuc2V0ID0gZnVuY3Rpb24gKHQsIGUpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgRCh0LCAwLCBlKVxuICAgICAgICB9LCBELmdldFR3ZWVuc09mID0gZnVuY3Rpb24gKHQsIGUpIHtcbiAgICAgICAgICAgIGlmIChudWxsID09IHQpcmV0dXJuW107XG4gICAgICAgICAgICB0ID0gXCJzdHJpbmdcIiAhPSB0eXBlb2YgdCA/IHQgOiBELnNlbGVjdG9yKHQpIHx8IHQ7XG4gICAgICAgICAgICB2YXIgaSwgcywgciwgbjtcbiAgICAgICAgICAgIGlmICgobSh0KSB8fCBFKHQpKSAmJiBcIm51bWJlclwiICE9IHR5cGVvZiB0WzBdKSB7XG4gICAgICAgICAgICAgICAgZm9yIChpID0gdC5sZW5ndGgsIHMgPSBbXTsgLS1pID4gLTE7KXMgPSBzLmNvbmNhdChELmdldFR3ZWVuc09mKHRbaV0sIGUpKTtcbiAgICAgICAgICAgICAgICBmb3IgKGkgPSBzLmxlbmd0aDsgLS1pID4gLTE7KWZvciAobiA9IHNbaV0sIHIgPSBpOyAtLXIgPiAtMTspbiA9PT0gc1tyXSAmJiBzLnNwbGljZShpLCAxKVxuICAgICAgICAgICAgfSBlbHNlIGZvciAocyA9IEIodCkuY29uY2F0KCksIGkgPSBzLmxlbmd0aDsgLS1pID4gLTE7KShzW2ldLl9nYyB8fCBlICYmICFzW2ldLmlzQWN0aXZlKCkpICYmIHMuc3BsaWNlKGksIDEpO1xuICAgICAgICAgICAgcmV0dXJuIHNcbiAgICAgICAgfSwgRC5raWxsVHdlZW5zT2YgPSBELmtpbGxEZWxheWVkQ2FsbHNUbyA9IGZ1bmN0aW9uICh0LCBlLCBpKSB7XG4gICAgICAgICAgICBcIm9iamVjdFwiID09IHR5cGVvZiBlICYmIChpID0gZSwgZSA9ICExKTtcbiAgICAgICAgICAgIGZvciAodmFyIHMgPSBELmdldFR3ZWVuc09mKHQsIGUpLCByID0gcy5sZW5ndGg7IC0tciA+IC0xOylzW3JdLl9raWxsKGksIHQpXG4gICAgICAgIH07XG4gICAgICAgIHZhciBNID0gZChcInBsdWdpbnMuVHdlZW5QbHVnaW5cIiwgZnVuY3Rpb24gKHQsIGUpIHtcbiAgICAgICAgICAgIHRoaXMuX292ZXJ3cml0ZVByb3BzID0gKHQgfHwgXCJcIikuc3BsaXQoXCIsXCIpLCB0aGlzLl9wcm9wTmFtZSA9IHRoaXMuX292ZXJ3cml0ZVByb3BzWzBdLCB0aGlzLl9wcmlvcml0eSA9IGUgfHwgMCwgdGhpcy5fc3VwZXIgPSBNLnByb3RvdHlwZVxuICAgICAgICB9LCAhMCk7XG4gICAgICAgIGlmIChyID0gTS5wcm90b3R5cGUsIE0udmVyc2lvbiA9IFwiMS4xMC4xXCIsIE0uQVBJID0gMiwgci5fZmlyc3RQVCA9IG51bGwsIHIuX2FkZFR3ZWVuID0gZnVuY3Rpb24gKHQsIGUsIGksIHMsIHIsIG4pIHtcbiAgICAgICAgICAgIHZhciBhLCBvO1xuICAgICAgICAgICAgcmV0dXJuIG51bGwgIT0gcyAmJiAoYSA9IFwibnVtYmVyXCIgPT0gdHlwZW9mIHMgfHwgXCI9XCIgIT09IHMuY2hhckF0KDEpID8gTnVtYmVyKHMpIC0gaSA6IHBhcnNlSW50KHMuY2hhckF0KDApICsgXCIxXCIsIDEwKSAqIE51bWJlcihzLnN1YnN0cigyKSkpID8gKHRoaXMuX2ZpcnN0UFQgPSBvID0ge19uZXh0OiB0aGlzLl9maXJzdFBULCB0OiB0LCBwOiBlLCBzOiBpLCBjOiBhLCBmOiBcImZ1bmN0aW9uXCIgPT0gdHlwZW9mIHRbZV0sIG46IHIgfHwgZSwgcjogbn0sIG8uX25leHQgJiYgKG8uX25leHQuX3ByZXYgPSBvKSwgbykgOiB2b2lkIDBcbiAgICAgICAgfSwgci5zZXRSYXRpbyA9IGZ1bmN0aW9uICh0KSB7XG4gICAgICAgICAgICBmb3IgKHZhciBlLCBpID0gdGhpcy5fZmlyc3RQVCwgcyA9IDFlLTY7IGk7KWUgPSBpLmMgKiB0ICsgaS5zLCBpLnIgPyBlID0gMCB8IGUgKyAoZSA+IDAgPyAuNSA6IC0uNSkgOiBzID4gZSAmJiBlID4gLXMgJiYgKGUgPSAwKSwgaS5mID8gaS50W2kucF0oZSkgOiBpLnRbaS5wXSA9IGUsIGkgPSBpLl9uZXh0XG4gICAgICAgIH0sIHIuX2tpbGwgPSBmdW5jdGlvbiAodCkge1xuICAgICAgICAgICAgdmFyIGUsIGkgPSB0aGlzLl9vdmVyd3JpdGVQcm9wcywgcyA9IHRoaXMuX2ZpcnN0UFQ7XG4gICAgICAgICAgICBpZiAobnVsbCAhPSB0W3RoaXMuX3Byb3BOYW1lXSl0aGlzLl9vdmVyd3JpdGVQcm9wcyA9IFtdOyBlbHNlIGZvciAoZSA9IGkubGVuZ3RoOyAtLWUgPiAtMTspbnVsbCAhPSB0W2lbZV1dICYmIGkuc3BsaWNlKGUsIDEpO1xuICAgICAgICAgICAgZm9yICg7IHM7KW51bGwgIT0gdFtzLm5dICYmIChzLl9uZXh0ICYmIChzLl9uZXh0Ll9wcmV2ID0gcy5fcHJldiksIHMuX3ByZXYgPyAocy5fcHJldi5fbmV4dCA9IHMuX25leHQsIHMuX3ByZXYgPSBudWxsKSA6IHRoaXMuX2ZpcnN0UFQgPT09IHMgJiYgKHRoaXMuX2ZpcnN0UFQgPSBzLl9uZXh0KSksIHMgPSBzLl9uZXh0O1xuICAgICAgICAgICAgcmV0dXJuITFcbiAgICAgICAgfSwgci5fcm91bmRQcm9wcyA9IGZ1bmN0aW9uICh0LCBlKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gdGhpcy5fZmlyc3RQVDsgaTspKHRbdGhpcy5fcHJvcE5hbWVdIHx8IG51bGwgIT0gaS5uICYmIHRbaS5uLnNwbGl0KHRoaXMuX3Byb3BOYW1lICsgXCJfXCIpLmpvaW4oXCJcIildKSAmJiAoaS5yID0gZSksIGkgPSBpLl9uZXh0XG4gICAgICAgIH0sIEQuX29uUGx1Z2luRXZlbnQgPSBmdW5jdGlvbiAodCwgZSkge1xuICAgICAgICAgICAgdmFyIGksIHMsIHIsIG4sIGEsIG8gPSBlLl9maXJzdFBUO1xuICAgICAgICAgICAgaWYgKFwiX29uSW5pdEFsbFByb3BzXCIgPT09IHQpIHtcbiAgICAgICAgICAgICAgICBmb3IgKDsgbzspIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChhID0gby5fbmV4dCwgcyA9IHI7IHMgJiYgcy5wciA+IG8ucHI7KXMgPSBzLl9uZXh0O1xuICAgICAgICAgICAgICAgICAgICAoby5fcHJldiA9IHMgPyBzLl9wcmV2IDogbikgPyBvLl9wcmV2Ll9uZXh0ID0gbyA6IHIgPSBvLCAoby5fbmV4dCA9IHMpID8gcy5fcHJldiA9IG8gOiBuID0gbywgbyA9IGFcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgbyA9IGUuX2ZpcnN0UFQgPSByXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmb3IgKDsgbzspby5wZyAmJiBcImZ1bmN0aW9uXCIgPT0gdHlwZW9mIG8udFt0XSAmJiBvLnRbdF0oKSAmJiAoaSA9ICEwKSwgbyA9IG8uX25leHQ7XG4gICAgICAgICAgICByZXR1cm4gaVxuICAgICAgICB9LCBNLmFjdGl2YXRlID0gZnVuY3Rpb24gKHQpIHtcbiAgICAgICAgICAgIGZvciAodmFyIGUgPSB0Lmxlbmd0aDsgLS1lID4gLTE7KXRbZV0uQVBJID09PSBNLkFQSSAmJiAoTlsobmV3IHRbZV0pLl9wcm9wTmFtZV0gPSB0W2VdKTtcbiAgICAgICAgICAgIHJldHVybiEwXG4gICAgICAgIH0sIGMucGx1Z2luID0gZnVuY3Rpb24gKHQpIHtcbiAgICAgICAgICAgIGlmICghKHQgJiYgdC5wcm9wTmFtZSAmJiB0LmluaXQgJiYgdC5BUEkpKXRocm93XCJpbGxlZ2FsIHBsdWdpbiBkZWZpbml0aW9uLlwiO1xuICAgICAgICAgICAgdmFyIGUsIGkgPSB0LnByb3BOYW1lLCBzID0gdC5wcmlvcml0eSB8fCAwLCByID0gdC5vdmVyd3JpdGVQcm9wcywgbiA9IHtpbml0OiBcIl9vbkluaXRUd2VlblwiLCBzZXQ6IFwic2V0UmF0aW9cIiwga2lsbDogXCJfa2lsbFwiLCByb3VuZDogXCJfcm91bmRQcm9wc1wiLCBpbml0QWxsOiBcIl9vbkluaXRBbGxQcm9wc1wifSwgYSA9IGQoXCJwbHVnaW5zLlwiICsgaS5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSArIGkuc3Vic3RyKDEpICsgXCJQbHVnaW5cIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIE0uY2FsbCh0aGlzLCBpLCBzKSwgdGhpcy5fb3ZlcndyaXRlUHJvcHMgPSByIHx8IFtdXG4gICAgICAgICAgICB9LCB0Lmdsb2JhbCA9PT0gITApLCBvID0gYS5wcm90b3R5cGUgPSBuZXcgTShpKTtcbiAgICAgICAgICAgIG8uY29uc3RydWN0b3IgPSBhLCBhLkFQSSA9IHQuQVBJO1xuICAgICAgICAgICAgZm9yIChlIGluIG4pXCJmdW5jdGlvblwiID09IHR5cGVvZiB0W2VdICYmIChvW25bZV1dID0gdFtlXSk7XG4gICAgICAgICAgICByZXR1cm4gYS52ZXJzaW9uID0gdC52ZXJzaW9uLCBNLmFjdGl2YXRlKFthXSksIGFcbiAgICAgICAgfSwgaSA9IHQuX2dzUXVldWUpIHtcbiAgICAgICAgICAgIGZvciAocyA9IDA7IGkubGVuZ3RoID4gczsgcysrKWlbc10oKTtcbiAgICAgICAgICAgIGZvciAociBpbiBmKWZbcl0uZnVuYyB8fCB0LmNvbnNvbGUubG9nKFwiR1NBUCBlbmNvdW50ZXJlZCBtaXNzaW5nIGRlcGVuZGVuY3k6IGNvbS5ncmVlbnNvY2suXCIgKyByKVxuICAgICAgICB9XG4gICAgICAgIGEgPSAhMVxuICAgIH1cbn0pKHdpbmRvdyk7IiwiLyohXG4gKiBWRVJTSU9OOiBiZXRhIDEuOS4zXG4gKiBEQVRFOiAyMDEzLTA0LTAyXG4gKiBVUERBVEVTIEFORCBET0NTIEFUOiBodHRwOi8vd3d3LmdyZWVuc29jay5jb21cbiAqXG4gKiBAbGljZW5zZSBDb3B5cmlnaHQgKGMpIDIwMDgtMjAxMywgR3JlZW5Tb2NrLiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICogVGhpcyB3b3JrIGlzIHN1YmplY3QgdG8gdGhlIHRlcm1zIGF0IGh0dHA6Ly93d3cuZ3JlZW5zb2NrLmNvbS90ZXJtc19vZl91c2UuaHRtbCBvciBmb3JcbiAqIENsdWIgR3JlZW5Tb2NrIG1lbWJlcnMsIHRoZSBzb2Z0d2FyZSBhZ3JlZW1lbnQgdGhhdCB3YXMgaXNzdWVkIHdpdGggeW91ciBtZW1iZXJzaGlwLlxuICogXG4gKiBAYXV0aG9yOiBKYWNrIERveWxlLCBqYWNrQGdyZWVuc29jay5jb21cbiAqKi9cbih3aW5kb3cuX2dzUXVldWUgfHwgKHdpbmRvdy5fZ3NRdWV1ZSA9IFtdKSkucHVzaChmdW5jdGlvbiAoKSB7XG4gICAgXCJ1c2Ugc3RyaWN0XCI7XG4gICAgd2luZG93Ll9nc0RlZmluZShcImVhc2luZy5CYWNrXCIsIFtcImVhc2luZy5FYXNlXCJdLCBmdW5jdGlvbiAodCkge1xuICAgICAgICB2YXIgZSwgaSwgcywgciA9IHdpbmRvdy5HcmVlblNvY2tHbG9iYWxzIHx8IHdpbmRvdywgbiA9IHIuY29tLmdyZWVuc29jaywgYSA9IDIgKiBNYXRoLlBJLCBvID0gTWF0aC5QSSAvIDIsIGggPSBuLl9jbGFzcywgbCA9IGZ1bmN0aW9uIChlLCBpKSB7XG4gICAgICAgICAgICB2YXIgcyA9IGgoXCJlYXNpbmcuXCIgKyBlLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB9LCAhMCksIHIgPSBzLnByb3RvdHlwZSA9IG5ldyB0O1xuICAgICAgICAgICAgcmV0dXJuIHIuY29uc3RydWN0b3IgPSBzLCByLmdldFJhdGlvID0gaSwgc1xuICAgICAgICB9LCBfID0gdC5yZWdpc3RlciB8fCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIH0sIHUgPSBmdW5jdGlvbiAodCwgZSwgaSwgcykge1xuICAgICAgICAgICAgdmFyIHIgPSBoKFwiZWFzaW5nLlwiICsgdCwge2Vhc2VPdXQ6IG5ldyBlLCBlYXNlSW46IG5ldyBpLCBlYXNlSW5PdXQ6IG5ldyBzfSwgITApO1xuICAgICAgICAgICAgcmV0dXJuIF8ociwgdCksIHJcbiAgICAgICAgfSwgYyA9IGZ1bmN0aW9uICh0LCBlLCBpKSB7XG4gICAgICAgICAgICB0aGlzLnQgPSB0LCB0aGlzLnYgPSBlLCBpICYmICh0aGlzLm5leHQgPSBpLCBpLnByZXYgPSB0aGlzLCB0aGlzLmMgPSBpLnYgLSBlLCB0aGlzLmdhcCA9IGkudCAtIHQpXG4gICAgICAgIH0sIHAgPSBmdW5jdGlvbiAoZSwgaSkge1xuICAgICAgICAgICAgdmFyIHMgPSBoKFwiZWFzaW5nLlwiICsgZSwgZnVuY3Rpb24gKHQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9wMSA9IHQgfHwgMCA9PT0gdCA/IHQgOiAxLjcwMTU4LCB0aGlzLl9wMiA9IDEuNTI1ICogdGhpcy5fcDFcbiAgICAgICAgICAgIH0sICEwKSwgciA9IHMucHJvdG90eXBlID0gbmV3IHQ7XG4gICAgICAgICAgICByZXR1cm4gci5jb25zdHJ1Y3RvciA9IHMsIHIuZ2V0UmF0aW8gPSBpLCByLmNvbmZpZyA9IGZ1bmN0aW9uICh0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBzKHQpXG4gICAgICAgICAgICB9LCBzXG4gICAgICAgIH0sIGYgPSB1KFwiQmFja1wiLCBwKFwiQmFja091dFwiLCBmdW5jdGlvbiAodCkge1xuICAgICAgICAgICAgcmV0dXJuKHQgLT0gMSkgKiB0ICogKCh0aGlzLl9wMSArIDEpICogdCArIHRoaXMuX3AxKSArIDFcbiAgICAgICAgfSksIHAoXCJCYWNrSW5cIiwgZnVuY3Rpb24gKHQpIHtcbiAgICAgICAgICAgIHJldHVybiB0ICogdCAqICgodGhpcy5fcDEgKyAxKSAqIHQgLSB0aGlzLl9wMSlcbiAgICAgICAgfSksIHAoXCJCYWNrSW5PdXRcIiwgZnVuY3Rpb24gKHQpIHtcbiAgICAgICAgICAgIHJldHVybiAxID4gKHQgKj0gMikgPyAuNSAqIHQgKiB0ICogKCh0aGlzLl9wMiArIDEpICogdCAtIHRoaXMuX3AyKSA6IC41ICogKCh0IC09IDIpICogdCAqICgodGhpcy5fcDIgKyAxKSAqIHQgKyB0aGlzLl9wMikgKyAyKVxuICAgICAgICB9KSksIG0gPSBoKFwiZWFzaW5nLlNsb3dNb1wiLCBmdW5jdGlvbiAodCwgZSwgaSkge1xuICAgICAgICAgICAgZSA9IGUgfHwgMCA9PT0gZSA/IGUgOiAuNywgbnVsbCA9PSB0ID8gdCA9IC43IDogdCA+IDEgJiYgKHQgPSAxKSwgdGhpcy5fcCA9IDEgIT09IHQgPyBlIDogMCwgdGhpcy5fcDEgPSAoMSAtIHQpIC8gMiwgdGhpcy5fcDIgPSB0LCB0aGlzLl9wMyA9IHRoaXMuX3AxICsgdGhpcy5fcDIsIHRoaXMuX2NhbGNFbmQgPSBpID09PSAhMFxuICAgICAgICB9LCAhMCksIGQgPSBtLnByb3RvdHlwZSA9IG5ldyB0O1xuICAgICAgICByZXR1cm4gZC5jb25zdHJ1Y3RvciA9IG0sIGQuZ2V0UmF0aW8gPSBmdW5jdGlvbiAodCkge1xuICAgICAgICAgICAgdmFyIGUgPSB0ICsgKC41IC0gdCkgKiB0aGlzLl9wO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3AxID4gdCA/IHRoaXMuX2NhbGNFbmQgPyAxIC0gKHQgPSAxIC0gdCAvIHRoaXMuX3AxKSAqIHQgOiBlIC0gKHQgPSAxIC0gdCAvIHRoaXMuX3AxKSAqIHQgKiB0ICogdCAqIGUgOiB0ID4gdGhpcy5fcDMgPyB0aGlzLl9jYWxjRW5kID8gMSAtICh0ID0gKHQgLSB0aGlzLl9wMykgLyB0aGlzLl9wMSkgKiB0IDogZSArICh0IC0gZSkgKiAodCA9ICh0IC0gdGhpcy5fcDMpIC8gdGhpcy5fcDEpICogdCAqIHQgKiB0IDogdGhpcy5fY2FsY0VuZCA/IDEgOiBlXG4gICAgICAgIH0sIG0uZWFzZSA9IG5ldyBtKC43LCAuNyksIGQuY29uZmlnID0gbS5jb25maWcgPSBmdW5jdGlvbiAodCwgZSwgaSkge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBtKHQsIGUsIGkpXG4gICAgICAgIH0sIGUgPSBoKFwiZWFzaW5nLlN0ZXBwZWRFYXNlXCIsIGZ1bmN0aW9uICh0KSB7XG4gICAgICAgICAgICB0ID0gdCB8fCAxLCB0aGlzLl9wMSA9IDEgLyB0LCB0aGlzLl9wMiA9IHQgKyAxXG4gICAgICAgIH0sICEwKSwgZCA9IGUucHJvdG90eXBlID0gbmV3IHQsIGQuY29uc3RydWN0b3IgPSBlLCBkLmdldFJhdGlvID0gZnVuY3Rpb24gKHQpIHtcbiAgICAgICAgICAgIHJldHVybiAwID4gdCA/IHQgPSAwIDogdCA+PSAxICYmICh0ID0gLjk5OTk5OTk5OSksICh0aGlzLl9wMiAqIHQgPj4gMCkgKiB0aGlzLl9wMVxuICAgICAgICB9LCBkLmNvbmZpZyA9IGUuY29uZmlnID0gZnVuY3Rpb24gKHQpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgZSh0KVxuICAgICAgICB9LCBpID0gaChcImVhc2luZy5Sb3VnaEVhc2VcIiwgZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgIGUgPSBlIHx8IHt9O1xuICAgICAgICAgICAgZm9yICh2YXIgaSwgcywgciwgbiwgYSwgbywgaCA9IGUudGFwZXIgfHwgXCJub25lXCIsIGwgPSBbXSwgXyA9IDAsIHUgPSAwIHwgKGUucG9pbnRzIHx8IDIwKSwgcCA9IHUsIGYgPSBlLnJhbmRvbWl6ZSAhPT0gITEsIG0gPSBlLmNsYW1wID09PSAhMCwgZCA9IGUudGVtcGxhdGUgaW5zdGFuY2VvZiB0ID8gZS50ZW1wbGF0ZSA6IG51bGwsIGcgPSBcIm51bWJlclwiID09IHR5cGVvZiBlLnN0cmVuZ3RoID8gLjQgKiBlLnN0cmVuZ3RoIDogLjQ7IC0tcCA+IC0xOylpID0gZiA/IE1hdGgucmFuZG9tKCkgOiAxIC8gdSAqIHAsIHMgPSBkID8gZC5nZXRSYXRpbyhpKSA6IGksIFwibm9uZVwiID09PSBoID8gciA9IGcgOiBcIm91dFwiID09PSBoID8gKG4gPSAxIC0gaSwgciA9IG4gKiBuICogZykgOiBcImluXCIgPT09IGggPyByID0gaSAqIGkgKiBnIDogLjUgPiBpID8gKG4gPSAyICogaSwgciA9IC41ICogbiAqIG4gKiBnKSA6IChuID0gMiAqICgxIC0gaSksIHIgPSAuNSAqIG4gKiBuICogZyksIGYgPyBzICs9IE1hdGgucmFuZG9tKCkgKiByIC0gLjUgKiByIDogcCAlIDIgPyBzICs9IC41ICogciA6IHMgLT0gLjUgKiByLCBtICYmIChzID4gMSA/IHMgPSAxIDogMCA+IHMgJiYgKHMgPSAwKSksIGxbXysrXSA9IHt4OiBpLCB5OiBzfTtcbiAgICAgICAgICAgIGZvciAobC5zb3J0KGZ1bmN0aW9uICh0LCBlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHQueCAtIGUueFxuICAgICAgICAgICAgfSksIG8gPSBuZXcgYygxLCAxLCBudWxsKSwgcCA9IHU7IC0tcCA+IC0xOylhID0gbFtwXSwgbyA9IG5ldyBjKGEueCwgYS55LCBvKTtcbiAgICAgICAgICAgIHRoaXMuX3ByZXYgPSBuZXcgYygwLCAwLCAwICE9PSBvLnQgPyBvIDogby5uZXh0KVxuICAgICAgICB9LCAhMCksIGQgPSBpLnByb3RvdHlwZSA9IG5ldyB0LCBkLmNvbnN0cnVjdG9yID0gaSwgZC5nZXRSYXRpbyA9IGZ1bmN0aW9uICh0KSB7XG4gICAgICAgICAgICB2YXIgZSA9IHRoaXMuX3ByZXY7XG4gICAgICAgICAgICBpZiAodCA+IGUudCkge1xuICAgICAgICAgICAgICAgIGZvciAoOyBlLm5leHQgJiYgdCA+PSBlLnQ7KWUgPSBlLm5leHQ7XG4gICAgICAgICAgICAgICAgZSA9IGUucHJldlxuICAgICAgICAgICAgfSBlbHNlIGZvciAoOyBlLnByZXYgJiYgZS50ID49IHQ7KWUgPSBlLnByZXY7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fcHJldiA9IGUsIGUudiArICh0IC0gZS50KSAvIGUuZ2FwICogZS5jXG4gICAgICAgIH0sIGQuY29uZmlnID0gZnVuY3Rpb24gKHQpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgaSh0KVxuICAgICAgICB9LCBpLmVhc2UgPSBuZXcgaSwgdShcIkJvdW5jZVwiLCBsKFwiQm91bmNlT3V0XCIsIGZ1bmN0aW9uICh0KSB7XG4gICAgICAgICAgICByZXR1cm4gMSAvIDIuNzUgPiB0ID8gNy41NjI1ICogdCAqIHQgOiAyIC8gMi43NSA+IHQgPyA3LjU2MjUgKiAodCAtPSAxLjUgLyAyLjc1KSAqIHQgKyAuNzUgOiAyLjUgLyAyLjc1ID4gdCA/IDcuNTYyNSAqICh0IC09IDIuMjUgLyAyLjc1KSAqIHQgKyAuOTM3NSA6IDcuNTYyNSAqICh0IC09IDIuNjI1IC8gMi43NSkgKiB0ICsgLjk4NDM3NVxuICAgICAgICB9KSwgbChcIkJvdW5jZUluXCIsIGZ1bmN0aW9uICh0KSB7XG4gICAgICAgICAgICByZXR1cm4gMSAvIDIuNzUgPiAodCA9IDEgLSB0KSA/IDEgLSA3LjU2MjUgKiB0ICogdCA6IDIgLyAyLjc1ID4gdCA/IDEgLSAoNy41NjI1ICogKHQgLT0gMS41IC8gMi43NSkgKiB0ICsgLjc1KSA6IDIuNSAvIDIuNzUgPiB0ID8gMSAtICg3LjU2MjUgKiAodCAtPSAyLjI1IC8gMi43NSkgKiB0ICsgLjkzNzUpIDogMSAtICg3LjU2MjUgKiAodCAtPSAyLjYyNSAvIDIuNzUpICogdCArIC45ODQzNzUpXG4gICAgICAgIH0pLCBsKFwiQm91bmNlSW5PdXRcIiwgZnVuY3Rpb24gKHQpIHtcbiAgICAgICAgICAgIHZhciBlID0gLjUgPiB0O1xuICAgICAgICAgICAgcmV0dXJuIHQgPSBlID8gMSAtIDIgKiB0IDogMiAqIHQgLSAxLCB0ID0gMSAvIDIuNzUgPiB0ID8gNy41NjI1ICogdCAqIHQgOiAyIC8gMi43NSA+IHQgPyA3LjU2MjUgKiAodCAtPSAxLjUgLyAyLjc1KSAqIHQgKyAuNzUgOiAyLjUgLyAyLjc1ID4gdCA/IDcuNTYyNSAqICh0IC09IDIuMjUgLyAyLjc1KSAqIHQgKyAuOTM3NSA6IDcuNTYyNSAqICh0IC09IDIuNjI1IC8gMi43NSkgKiB0ICsgLjk4NDM3NSwgZSA/IC41ICogKDEgLSB0KSA6IC41ICogdCArIC41XG4gICAgICAgIH0pKSwgdShcIkNpcmNcIiwgbChcIkNpcmNPdXRcIiwgZnVuY3Rpb24gKHQpIHtcbiAgICAgICAgICAgIHJldHVybiBNYXRoLnNxcnQoMSAtICh0IC09IDEpICogdClcbiAgICAgICAgfSksIGwoXCJDaXJjSW5cIiwgZnVuY3Rpb24gKHQpIHtcbiAgICAgICAgICAgIHJldHVybi0oTWF0aC5zcXJ0KDEgLSB0ICogdCkgLSAxKVxuICAgICAgICB9KSwgbChcIkNpcmNJbk91dFwiLCBmdW5jdGlvbiAodCkge1xuICAgICAgICAgICAgcmV0dXJuIDEgPiAodCAqPSAyKSA/IC0uNSAqIChNYXRoLnNxcnQoMSAtIHQgKiB0KSAtIDEpIDogLjUgKiAoTWF0aC5zcXJ0KDEgLSAodCAtPSAyKSAqIHQpICsgMSlcbiAgICAgICAgfSkpLCBzID0gZnVuY3Rpb24gKGUsIGksIHMpIHtcbiAgICAgICAgICAgIHZhciByID0gaChcImVhc2luZy5cIiArIGUsIGZ1bmN0aW9uICh0LCBlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fcDEgPSB0IHx8IDEsIHRoaXMuX3AyID0gZSB8fCBzLCB0aGlzLl9wMyA9IHRoaXMuX3AyIC8gYSAqIChNYXRoLmFzaW4oMSAvIHRoaXMuX3AxKSB8fCAwKVxuICAgICAgICAgICAgfSwgITApLCBuID0gci5wcm90b3R5cGUgPSBuZXcgdDtcbiAgICAgICAgICAgIHJldHVybiBuLmNvbnN0cnVjdG9yID0gciwgbi5nZXRSYXRpbyA9IGksIG4uY29uZmlnID0gZnVuY3Rpb24gKHQsIGUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IHIodCwgZSlcbiAgICAgICAgICAgIH0sIHJcbiAgICAgICAgfSwgdShcIkVsYXN0aWNcIiwgcyhcIkVsYXN0aWNPdXRcIiwgZnVuY3Rpb24gKHQpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9wMSAqIE1hdGgucG93KDIsIC0xMCAqIHQpICogTWF0aC5zaW4oKHQgLSB0aGlzLl9wMykgKiBhIC8gdGhpcy5fcDIpICsgMVxuICAgICAgICB9LCAuMyksIHMoXCJFbGFzdGljSW5cIiwgZnVuY3Rpb24gKHQpIHtcbiAgICAgICAgICAgIHJldHVybi0odGhpcy5fcDEgKiBNYXRoLnBvdygyLCAxMCAqICh0IC09IDEpKSAqIE1hdGguc2luKCh0IC0gdGhpcy5fcDMpICogYSAvIHRoaXMuX3AyKSlcbiAgICAgICAgfSwgLjMpLCBzKFwiRWxhc3RpY0luT3V0XCIsIGZ1bmN0aW9uICh0KSB7XG4gICAgICAgICAgICByZXR1cm4gMSA+ICh0ICo9IDIpID8gLS41ICogdGhpcy5fcDEgKiBNYXRoLnBvdygyLCAxMCAqICh0IC09IDEpKSAqIE1hdGguc2luKCh0IC0gdGhpcy5fcDMpICogYSAvIHRoaXMuX3AyKSA6IC41ICogdGhpcy5fcDEgKiBNYXRoLnBvdygyLCAtMTAgKiAodCAtPSAxKSkgKiBNYXRoLnNpbigodCAtIHRoaXMuX3AzKSAqIGEgLyB0aGlzLl9wMikgKyAxXG4gICAgICAgIH0sIC40NSkpLCB1KFwiRXhwb1wiLCBsKFwiRXhwb091dFwiLCBmdW5jdGlvbiAodCkge1xuICAgICAgICAgICAgcmV0dXJuIDEgLSBNYXRoLnBvdygyLCAtMTAgKiB0KVxuICAgICAgICB9KSwgbChcIkV4cG9JblwiLCBmdW5jdGlvbiAodCkge1xuICAgICAgICAgICAgcmV0dXJuIE1hdGgucG93KDIsIDEwICogKHQgLSAxKSkgLSAuMDAxXG4gICAgICAgIH0pLCBsKFwiRXhwb0luT3V0XCIsIGZ1bmN0aW9uICh0KSB7XG4gICAgICAgICAgICByZXR1cm4gMSA+ICh0ICo9IDIpID8gLjUgKiBNYXRoLnBvdygyLCAxMCAqICh0IC0gMSkpIDogLjUgKiAoMiAtIE1hdGgucG93KDIsIC0xMCAqICh0IC0gMSkpKVxuICAgICAgICB9KSksIHUoXCJTaW5lXCIsIGwoXCJTaW5lT3V0XCIsIGZ1bmN0aW9uICh0KSB7XG4gICAgICAgICAgICByZXR1cm4gTWF0aC5zaW4odCAqIG8pXG4gICAgICAgIH0pLCBsKFwiU2luZUluXCIsIGZ1bmN0aW9uICh0KSB7XG4gICAgICAgICAgICByZXR1cm4tTWF0aC5jb3ModCAqIG8pICsgMVxuICAgICAgICB9KSwgbChcIlNpbmVJbk91dFwiLCBmdW5jdGlvbiAodCkge1xuICAgICAgICAgICAgcmV0dXJuLS41ICogKE1hdGguY29zKE1hdGguUEkgKiB0KSAtIDEpXG4gICAgICAgIH0pKSwgaChcImVhc2luZy5FYXNlTG9va3VwXCIsIHtmaW5kOiBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgcmV0dXJuIHQubWFwW2VdXG4gICAgICAgIH19LCAhMCksIF8oci5TbG93TW8sIFwiU2xvd01vXCIsIFwiZWFzZSxcIiksIF8oaSwgXCJSb3VnaEVhc2VcIiwgXCJlYXNlLFwiKSwgXyhlLCBcIlN0ZXBwZWRFYXNlXCIsIFwiZWFzZSxcIiksIGZcbiAgICB9LCAhMClcbn0pLCB3aW5kb3cuX2dzRGVmaW5lICYmIHdpbmRvdy5fZ3NRdWV1ZS5wb3AoKSgpOyIsIi8qIVxuICogVkVSU0lPTjogYmV0YSAxLjExLjBcbiAqIERBVEU6IDIwMTMtMTAtMjFcbiAqIFVQREFURVMgQU5EIERPQ1MgQVQ6IGh0dHA6Ly93d3cuZ3JlZW5zb2NrLmNvbVxuICpcbiAqIEBsaWNlbnNlIENvcHlyaWdodCAoYykgMjAwOC0yMDEzLCBHcmVlblNvY2suIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKiBUaGlzIHdvcmsgaXMgc3ViamVjdCB0byB0aGUgdGVybXMgYXQgaHR0cDovL3d3dy5ncmVlbnNvY2suY29tL3Rlcm1zX29mX3VzZS5odG1sIG9yIGZvclxuICogQ2x1YiBHcmVlblNvY2sgbWVtYmVycywgdGhlIHNvZnR3YXJlIGFncmVlbWVudCB0aGF0IHdhcyBpc3N1ZWQgd2l0aCB5b3VyIG1lbWJlcnNoaXAuXG4gKiBcbiAqIEBhdXRob3I6IEphY2sgRG95bGUsIGphY2tAZ3JlZW5zb2NrLmNvbVxuICovXG4od2luZG93Ll9nc1F1ZXVlIHx8ICh3aW5kb3cuX2dzUXVldWUgPSBbXSkpLnB1c2goZnVuY3Rpb24gKCkge1xuICAgIFwidXNlIHN0cmljdFwiO1xuICAgIHdpbmRvdy5fZ3NEZWZpbmUoXCJwbHVnaW5zLkNTU1BsdWdpblwiLCBbXCJwbHVnaW5zLlR3ZWVuUGx1Z2luXCIsIFwiVHdlZW5MaXRlXCJdLCBmdW5jdGlvbiAodCwgZSkge1xuICAgICAgICB2YXIgaSwgcywgciwgbiwgYSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHQuY2FsbCh0aGlzLCBcImNzc1wiKSwgdGhpcy5fb3ZlcndyaXRlUHJvcHMubGVuZ3RoID0gMCwgdGhpcy5zZXRSYXRpbyA9IGEucHJvdG90eXBlLnNldFJhdGlvXG4gICAgICAgIH0sIG8gPSB7fSwgbCA9IGEucHJvdG90eXBlID0gbmV3IHQoXCJjc3NcIik7XG4gICAgICAgIGwuY29uc3RydWN0b3IgPSBhLCBhLnZlcnNpb24gPSBcIjEuMTEuMFwiLCBhLkFQSSA9IDIsIGEuZGVmYXVsdFRyYW5zZm9ybVBlcnNwZWN0aXZlID0gMCwgbCA9IFwicHhcIiwgYS5zdWZmaXhNYXAgPSB7dG9wOiBsLCByaWdodDogbCwgYm90dG9tOiBsLCBsZWZ0OiBsLCB3aWR0aDogbCwgaGVpZ2h0OiBsLCBmb250U2l6ZTogbCwgcGFkZGluZzogbCwgbWFyZ2luOiBsLCBwZXJzcGVjdGl2ZTogbH07XG4gICAgICAgIHZhciBoLCB1LCBfLCBwLCBmLCBjLCBkID0gLyg/OlxcZHxcXC1cXGR8XFwuXFxkfFxcLVxcLlxcZCkrL2csIG0gPSAvKD86XFxkfFxcLVxcZHxcXC5cXGR8XFwtXFwuXFxkfFxcKz1cXGR8XFwtPVxcZHxcXCs9LlxcZHxcXC09XFwuXFxkKSsvZywgZyA9IC8oPzpcXCs9fFxcLT18XFwtfFxcYilbXFxkXFwtXFwuXStbYS16QS1aMC05XSooPzolfFxcYikvZ2ksIHYgPSAvW15cXGRcXC1cXC5dL2csIHkgPSAvKD86XFxkfFxcLXxcXCt8PXwjfFxcLikqL2csIFQgPSAvb3BhY2l0eSAqPSAqKFteKV0qKS8sIHggPSAvb3BhY2l0eTooW147XSopLywgdyA9IC9hbHBoYVxcKG9wYWNpdHkgKj0uKz9cXCkvaSwgYiA9IC9eKHJnYnxoc2wpLywgUCA9IC8oW0EtWl0pL2csIFMgPSAvLShbYS16XSkvZ2ksIFIgPSAvKF4oPzp1cmxcXChcXFwifHVybFxcKCkpfCg/OihcXFwiXFwpKSR8XFwpJCkvZ2ksIGsgPSBmdW5jdGlvbiAodCwgZSkge1xuICAgICAgICAgICAgcmV0dXJuIGUudG9VcHBlckNhc2UoKVxuICAgICAgICB9LCBDID0gLyg/OkxlZnR8UmlnaHR8V2lkdGgpL2ksIEEgPSAvKE0xMXxNMTJ8TTIxfE0yMik9W1xcZFxcLVxcLmVdKy9naSwgTyA9IC9wcm9naWRcXDpEWEltYWdlVHJhbnNmb3JtXFwuTWljcm9zb2Z0XFwuTWF0cml4XFwoLis/XFwpL2ksIEQgPSAvLCg/PVteXFwpXSooPzpcXCh8JCkpL2dpLCBNID0gTWF0aC5QSSAvIDE4MCwgTCA9IDE4MCAvIE1hdGguUEksIE4gPSB7fSwgWCA9IGRvY3VtZW50LCBGID0gWC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpLCBJID0gWC5jcmVhdGVFbGVtZW50KFwiaW1nXCIpLCBFID0gYS5faW50ZXJuYWxzID0ge19zcGVjaWFsUHJvcHM6IG99LCBZID0gbmF2aWdhdG9yLnVzZXJBZ2VudCwgeiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciB0LCBlID0gWS5pbmRleE9mKFwiQW5kcm9pZFwiKSwgaSA9IFguY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICAgICAgICAgIHJldHVybiBfID0gLTEgIT09IFkuaW5kZXhPZihcIlNhZmFyaVwiKSAmJiAtMSA9PT0gWS5pbmRleE9mKFwiQ2hyb21lXCIpICYmICgtMSA9PT0gZSB8fCBOdW1iZXIoWS5zdWJzdHIoZSArIDgsIDEpKSA+IDMpLCBmID0gXyAmJiA2ID4gTnVtYmVyKFkuc3Vic3RyKFkuaW5kZXhPZihcIlZlcnNpb24vXCIpICsgOCwgMSkpLCBwID0gLTEgIT09IFkuaW5kZXhPZihcIkZpcmVmb3hcIiksIC9NU0lFIChbMC05XXsxLH1bXFwuMC05XXswLH0pLy5leGVjKFkpLCBjID0gcGFyc2VGbG9hdChSZWdFeHAuJDEpLCBpLmlubmVySFRNTCA9IFwiPGEgc3R5bGU9J3RvcDoxcHg7b3BhY2l0eTouNTU7Jz5hPC9hPlwiLCB0ID0gaS5nZXRFbGVtZW50c0J5VGFnTmFtZShcImFcIilbMF0sIHQgPyAvXjAuNTUvLnRlc3QodC5zdHlsZS5vcGFjaXR5KSA6ICExXG4gICAgICAgIH0oKSwgVSA9IGZ1bmN0aW9uICh0KSB7XG4gICAgICAgICAgICByZXR1cm4gVC50ZXN0KFwic3RyaW5nXCIgPT0gdHlwZW9mIHQgPyB0IDogKHQuY3VycmVudFN0eWxlID8gdC5jdXJyZW50U3R5bGUuZmlsdGVyIDogdC5zdHlsZS5maWx0ZXIpIHx8IFwiXCIpID8gcGFyc2VGbG9hdChSZWdFeHAuJDEpIC8gMTAwIDogMVxuICAgICAgICB9LCBCID0gZnVuY3Rpb24gKHQpIHtcbiAgICAgICAgICAgIHdpbmRvdy5jb25zb2xlICYmIGNvbnNvbGUubG9nKHQpXG4gICAgICAgIH0sIGogPSBcIlwiLCBWID0gXCJcIiwgcSA9IGZ1bmN0aW9uICh0LCBlKSB7XG4gICAgICAgICAgICBlID0gZSB8fCBGO1xuICAgICAgICAgICAgdmFyIGksIHMsIHIgPSBlLnN0eWxlO1xuICAgICAgICAgICAgaWYgKHZvaWQgMCAhPT0gclt0XSlyZXR1cm4gdDtcbiAgICAgICAgICAgIGZvciAodCA9IHQuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyB0LnN1YnN0cigxKSwgaSA9IFtcIk9cIiwgXCJNb3pcIiwgXCJtc1wiLCBcIk1zXCIsIFwiV2Via2l0XCJdLCBzID0gNTsgLS1zID4gLTEgJiYgdm9pZCAwID09PSByW2lbc10gKyB0XTspO1xuICAgICAgICAgICAgcmV0dXJuIHMgPj0gMCA/IChWID0gMyA9PT0gcyA/IFwibXNcIiA6IGlbc10sIGogPSBcIi1cIiArIFYudG9Mb3dlckNhc2UoKSArIFwiLVwiLCBWICsgdCkgOiBudWxsXG4gICAgICAgIH0sIFcgPSBYLmRlZmF1bHRWaWV3ID8gWC5kZWZhdWx0Vmlldy5nZXRDb21wdXRlZFN0eWxlIDogZnVuY3Rpb24gKCkge1xuICAgICAgICB9LCBRID0gYS5nZXRTdHlsZSA9IGZ1bmN0aW9uICh0LCBlLCBpLCBzLCByKSB7XG4gICAgICAgICAgICB2YXIgbjtcbiAgICAgICAgICAgIHJldHVybiB6IHx8IFwib3BhY2l0eVwiICE9PSBlID8gKCFzICYmIHQuc3R5bGVbZV0gPyBuID0gdC5zdHlsZVtlXSA6IChpID0gaSB8fCBXKHQsIG51bGwpKSA/ICh0ID0gaS5nZXRQcm9wZXJ0eVZhbHVlKGUucmVwbGFjZShQLCBcIi0kMVwiKS50b0xvd2VyQ2FzZSgpKSwgbiA9IHQgfHwgaS5sZW5ndGggPyB0IDogaVtlXSkgOiB0LmN1cnJlbnRTdHlsZSAmJiAobiA9IHQuY3VycmVudFN0eWxlW2VdKSwgbnVsbCA9PSByIHx8IG4gJiYgXCJub25lXCIgIT09IG4gJiYgXCJhdXRvXCIgIT09IG4gJiYgXCJhdXRvIGF1dG9cIiAhPT0gbiA/IG4gOiByKSA6IFUodClcbiAgICAgICAgfSwgWiA9IGZ1bmN0aW9uICh0LCBlLCBpLCBzLCByKSB7XG4gICAgICAgICAgICBpZiAoXCJweFwiID09PSBzIHx8ICFzKXJldHVybiBpO1xuICAgICAgICAgICAgaWYgKFwiYXV0b1wiID09PSBzIHx8ICFpKXJldHVybiAwO1xuICAgICAgICAgICAgdmFyIG4sIGEgPSBDLnRlc3QoZSksIG8gPSB0LCBsID0gRi5zdHlsZSwgaCA9IDAgPiBpO1xuICAgICAgICAgICAgcmV0dXJuIGggJiYgKGkgPSAtaSksIFwiJVwiID09PSBzICYmIC0xICE9PSBlLmluZGV4T2YoXCJib3JkZXJcIikgPyBuID0gaSAvIDEwMCAqIChhID8gdC5jbGllbnRXaWR0aCA6IHQuY2xpZW50SGVpZ2h0KSA6IChsLmNzc1RleHQgPSBcImJvcmRlci1zdHlsZTpzb2xpZDtib3JkZXItd2lkdGg6MDtwb3NpdGlvbjphYnNvbHV0ZTtsaW5lLWhlaWdodDowO1wiLCBcIiVcIiAhPT0gcyAmJiBvLmFwcGVuZENoaWxkID8gbFthID8gXCJib3JkZXJMZWZ0V2lkdGhcIiA6IFwiYm9yZGVyVG9wV2lkdGhcIl0gPSBpICsgcyA6IChvID0gdC5wYXJlbnROb2RlIHx8IFguYm9keSwgbFthID8gXCJ3aWR0aFwiIDogXCJoZWlnaHRcIl0gPSBpICsgcyksIG8uYXBwZW5kQ2hpbGQoRiksIG4gPSBwYXJzZUZsb2F0KEZbYSA/IFwib2Zmc2V0V2lkdGhcIiA6IFwib2Zmc2V0SGVpZ2h0XCJdKSwgby5yZW1vdmVDaGlsZChGKSwgMCAhPT0gbiB8fCByIHx8IChuID0gWih0LCBlLCBpLCBzLCAhMCkpKSwgaCA/IC1uIDogblxuICAgICAgICB9LCBIID0gZnVuY3Rpb24gKHQsIGUsIGkpIHtcbiAgICAgICAgICAgIGlmIChcImFic29sdXRlXCIgIT09IFEodCwgXCJwb3NpdGlvblwiLCBpKSlyZXR1cm4gMDtcbiAgICAgICAgICAgIHZhciBzID0gXCJsZWZ0XCIgPT09IGUgPyBcIkxlZnRcIiA6IFwiVG9wXCIsIHIgPSBRKHQsIFwibWFyZ2luXCIgKyBzLCBpKTtcbiAgICAgICAgICAgIHJldHVybiB0W1wib2Zmc2V0XCIgKyBzXSAtIChaKHQsIGUsIHBhcnNlRmxvYXQociksIHIucmVwbGFjZSh5LCBcIlwiKSkgfHwgMClcbiAgICAgICAgfSwgJCA9IGZ1bmN0aW9uICh0LCBlKSB7XG4gICAgICAgICAgICB2YXIgaSwgcywgciA9IHt9O1xuICAgICAgICAgICAgaWYgKGUgPSBlIHx8IFcodCwgbnVsbCkpaWYgKGkgPSBlLmxlbmd0aClmb3IgKDsgLS1pID4gLTE7KXJbZVtpXS5yZXBsYWNlKFMsIGspXSA9IGUuZ2V0UHJvcGVydHlWYWx1ZShlW2ldKTsgZWxzZSBmb3IgKGkgaW4gZSlyW2ldID0gZVtpXTsgZWxzZSBpZiAoZSA9IHQuY3VycmVudFN0eWxlIHx8IHQuc3R5bGUpZm9yIChpIGluIGUpXCJzdHJpbmdcIiA9PSB0eXBlb2YgaSAmJiB2b2lkIDAgIT09IHJbaV0gJiYgKHJbaS5yZXBsYWNlKFMsIGspXSA9IGVbaV0pO1xuICAgICAgICAgICAgcmV0dXJuIHogfHwgKHIub3BhY2l0eSA9IFUodCkpLCBzID0gYmUodCwgZSwgITEpLCByLnJvdGF0aW9uID0gcy5yb3RhdGlvbiwgci5za2V3WCA9IHMuc2tld1gsIHIuc2NhbGVYID0gcy5zY2FsZVgsIHIuc2NhbGVZID0gcy5zY2FsZVksIHIueCA9IHMueCwgci55ID0gcy55LCB3ZSAmJiAoci56ID0gcy56LCByLnJvdGF0aW9uWCA9IHMucm90YXRpb25YLCByLnJvdGF0aW9uWSA9IHMucm90YXRpb25ZLCByLnNjYWxlWiA9IHMuc2NhbGVaKSwgci5maWx0ZXJzICYmIGRlbGV0ZSByLmZpbHRlcnMsIHJcbiAgICAgICAgfSwgRyA9IGZ1bmN0aW9uICh0LCBlLCBpLCBzLCByKSB7XG4gICAgICAgICAgICB2YXIgbiwgYSwgbywgbCA9IHt9LCBoID0gdC5zdHlsZTtcbiAgICAgICAgICAgIGZvciAoYSBpbiBpKVwiY3NzVGV4dFwiICE9PSBhICYmIFwibGVuZ3RoXCIgIT09IGEgJiYgaXNOYU4oYSkgJiYgKGVbYV0gIT09IChuID0gaVthXSkgfHwgciAmJiByW2FdKSAmJiAtMSA9PT0gYS5pbmRleE9mKFwiT3JpZ2luXCIpICYmIChcIm51bWJlclwiID09IHR5cGVvZiBuIHx8IFwic3RyaW5nXCIgPT0gdHlwZW9mIG4pICYmIChsW2FdID0gXCJhdXRvXCIgIT09IG4gfHwgXCJsZWZ0XCIgIT09IGEgJiYgXCJ0b3BcIiAhPT0gYSA/IFwiXCIgIT09IG4gJiYgXCJhdXRvXCIgIT09IG4gJiYgXCJub25lXCIgIT09IG4gfHwgXCJzdHJpbmdcIiAhPSB0eXBlb2YgZVthXSB8fCBcIlwiID09PSBlW2FdLnJlcGxhY2UodiwgXCJcIikgPyBuIDogMCA6IEgodCwgYSksIHZvaWQgMCAhPT0gaFthXSAmJiAobyA9IG5ldyBfZShoLCBhLCBoW2FdLCBvKSkpO1xuICAgICAgICAgICAgaWYgKHMpZm9yIChhIGluIHMpXCJjbGFzc05hbWVcIiAhPT0gYSAmJiAobFthXSA9IHNbYV0pO1xuICAgICAgICAgICAgcmV0dXJue2RpZnM6IGwsIGZpcnN0TVBUOiBvfVxuICAgICAgICB9LCBLID0ge3dpZHRoOiBbXCJMZWZ0XCIsIFwiUmlnaHRcIl0sIGhlaWdodDogW1wiVG9wXCIsIFwiQm90dG9tXCJdfSwgSiA9IFtcIm1hcmdpbkxlZnRcIiwgXCJtYXJnaW5SaWdodFwiLCBcIm1hcmdpblRvcFwiLCBcIm1hcmdpbkJvdHRvbVwiXSwgdGUgPSBmdW5jdGlvbiAodCwgZSwgaSkge1xuICAgICAgICAgICAgdmFyIHMgPSBwYXJzZUZsb2F0KFwid2lkdGhcIiA9PT0gZSA/IHQub2Zmc2V0V2lkdGggOiB0Lm9mZnNldEhlaWdodCksIHIgPSBLW2VdLCBuID0gci5sZW5ndGg7XG4gICAgICAgICAgICBmb3IgKGkgPSBpIHx8IFcodCwgbnVsbCk7IC0tbiA+IC0xOylzIC09IHBhcnNlRmxvYXQoUSh0LCBcInBhZGRpbmdcIiArIHJbbl0sIGksICEwKSkgfHwgMCwgcyAtPSBwYXJzZUZsb2F0KFEodCwgXCJib3JkZXJcIiArIHJbbl0gKyBcIldpZHRoXCIsIGksICEwKSkgfHwgMDtcbiAgICAgICAgICAgIHJldHVybiBzXG4gICAgICAgIH0sIGVlID0gZnVuY3Rpb24gKHQsIGUpIHtcbiAgICAgICAgICAgIChudWxsID09IHQgfHwgXCJcIiA9PT0gdCB8fCBcImF1dG9cIiA9PT0gdCB8fCBcImF1dG8gYXV0b1wiID09PSB0KSAmJiAodCA9IFwiMCAwXCIpO1xuICAgICAgICAgICAgdmFyIGkgPSB0LnNwbGl0KFwiIFwiKSwgcyA9IC0xICE9PSB0LmluZGV4T2YoXCJsZWZ0XCIpID8gXCIwJVwiIDogLTEgIT09IHQuaW5kZXhPZihcInJpZ2h0XCIpID8gXCIxMDAlXCIgOiBpWzBdLCByID0gLTEgIT09IHQuaW5kZXhPZihcInRvcFwiKSA/IFwiMCVcIiA6IC0xICE9PSB0LmluZGV4T2YoXCJib3R0b21cIikgPyBcIjEwMCVcIiA6IGlbMV07XG4gICAgICAgICAgICByZXR1cm4gbnVsbCA9PSByID8gciA9IFwiMFwiIDogXCJjZW50ZXJcIiA9PT0gciAmJiAociA9IFwiNTAlXCIpLCAoXCJjZW50ZXJcIiA9PT0gcyB8fCBpc05hTihwYXJzZUZsb2F0KHMpKSAmJiAtMSA9PT0gKHMgKyBcIlwiKS5pbmRleE9mKFwiPVwiKSkgJiYgKHMgPSBcIjUwJVwiKSwgZSAmJiAoZS5veHAgPSAtMSAhPT0gcy5pbmRleE9mKFwiJVwiKSwgZS5veXAgPSAtMSAhPT0gci5pbmRleE9mKFwiJVwiKSwgZS5veHIgPSBcIj1cIiA9PT0gcy5jaGFyQXQoMSksIGUub3lyID0gXCI9XCIgPT09IHIuY2hhckF0KDEpLCBlLm94ID0gcGFyc2VGbG9hdChzLnJlcGxhY2UodiwgXCJcIikpLCBlLm95ID0gcGFyc2VGbG9hdChyLnJlcGxhY2UodiwgXCJcIikpKSwgcyArIFwiIFwiICsgciArIChpLmxlbmd0aCA+IDIgPyBcIiBcIiArIGlbMl0gOiBcIlwiKVxuICAgICAgICB9LCBpZSA9IGZ1bmN0aW9uICh0LCBlKSB7XG4gICAgICAgICAgICByZXR1cm5cInN0cmluZ1wiID09IHR5cGVvZiB0ICYmIFwiPVwiID09PSB0LmNoYXJBdCgxKSA/IHBhcnNlSW50KHQuY2hhckF0KDApICsgXCIxXCIsIDEwKSAqIHBhcnNlRmxvYXQodC5zdWJzdHIoMikpIDogcGFyc2VGbG9hdCh0KSAtIHBhcnNlRmxvYXQoZSlcbiAgICAgICAgfSwgc2UgPSBmdW5jdGlvbiAodCwgZSkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGwgPT0gdCA/IGUgOiBcInN0cmluZ1wiID09IHR5cGVvZiB0ICYmIFwiPVwiID09PSB0LmNoYXJBdCgxKSA/IHBhcnNlSW50KHQuY2hhckF0KDApICsgXCIxXCIsIDEwKSAqIE51bWJlcih0LnN1YnN0cigyKSkgKyBlIDogcGFyc2VGbG9hdCh0KVxuICAgICAgICB9LCByZSA9IGZ1bmN0aW9uICh0LCBlLCBpLCBzKSB7XG4gICAgICAgICAgICB2YXIgciwgbiwgYSwgbywgbCA9IDFlLTY7XG4gICAgICAgICAgICByZXR1cm4gbnVsbCA9PSB0ID8gbyA9IGUgOiBcIm51bWJlclwiID09IHR5cGVvZiB0ID8gbyA9IHQgOiAociA9IDM2MCwgbiA9IHQuc3BsaXQoXCJfXCIpLCBhID0gTnVtYmVyKG5bMF0ucmVwbGFjZSh2LCBcIlwiKSkgKiAoLTEgPT09IHQuaW5kZXhPZihcInJhZFwiKSA/IDEgOiBMKSAtIChcIj1cIiA9PT0gdC5jaGFyQXQoMSkgPyAwIDogZSksIG4ubGVuZ3RoICYmIChzICYmIChzW2ldID0gZSArIGEpLCAtMSAhPT0gdC5pbmRleE9mKFwic2hvcnRcIikgJiYgKGEgJT0gciwgYSAhPT0gYSAlIChyIC8gMikgJiYgKGEgPSAwID4gYSA/IGEgKyByIDogYSAtIHIpKSwgLTEgIT09IHQuaW5kZXhPZihcIl9jd1wiKSAmJiAwID4gYSA/IGEgPSAoYSArIDk5OTk5OTk5OTkgKiByKSAlIHIgLSAoMCB8IGEgLyByKSAqIHIgOiAtMSAhPT0gdC5pbmRleE9mKFwiY2N3XCIpICYmIGEgPiAwICYmIChhID0gKGEgLSA5OTk5OTk5OTk5ICogcikgJSByIC0gKDAgfCBhIC8gcikgKiByKSksIG8gPSBlICsgYSksIGwgPiBvICYmIG8gPiAtbCAmJiAobyA9IDApLCBvXG4gICAgICAgIH0sIG5lID0ge2FxdWE6IFswLCAyNTUsIDI1NV0sIGxpbWU6IFswLCAyNTUsIDBdLCBzaWx2ZXI6IFsxOTIsIDE5MiwgMTkyXSwgYmxhY2s6IFswLCAwLCAwXSwgbWFyb29uOiBbMTI4LCAwLCAwXSwgdGVhbDogWzAsIDEyOCwgMTI4XSwgYmx1ZTogWzAsIDAsIDI1NV0sIG5hdnk6IFswLCAwLCAxMjhdLCB3aGl0ZTogWzI1NSwgMjU1LCAyNTVdLCBmdWNoc2lhOiBbMjU1LCAwLCAyNTVdLCBvbGl2ZTogWzEyOCwgMTI4LCAwXSwgeWVsbG93OiBbMjU1LCAyNTUsIDBdLCBvcmFuZ2U6IFsyNTUsIDE2NSwgMF0sIGdyYXk6IFsxMjgsIDEyOCwgMTI4XSwgcHVycGxlOiBbMTI4LCAwLCAxMjhdLCBncmVlbjogWzAsIDEyOCwgMF0sIHJlZDogWzI1NSwgMCwgMF0sIHBpbms6IFsyNTUsIDE5MiwgMjAzXSwgY3lhbjogWzAsIDI1NSwgMjU1XSwgdHJhbnNwYXJlbnQ6IFsyNTUsIDI1NSwgMjU1LCAwXX0sIGFlID0gZnVuY3Rpb24gKHQsIGUsIGkpIHtcbiAgICAgICAgICAgIHJldHVybiB0ID0gMCA+IHQgPyB0ICsgMSA6IHQgPiAxID8gdCAtIDEgOiB0LCAwIHwgMjU1ICogKDEgPiA2ICogdCA/IGUgKyA2ICogKGkgLSBlKSAqIHQgOiAuNSA+IHQgPyBpIDogMiA+IDMgKiB0ID8gZSArIDYgKiAoaSAtIGUpICogKDIgLyAzIC0gdCkgOiBlKSArIC41XG4gICAgICAgIH0sIG9lID0gZnVuY3Rpb24gKHQpIHtcbiAgICAgICAgICAgIHZhciBlLCBpLCBzLCByLCBuLCBhO1xuICAgICAgICAgICAgcmV0dXJuIHQgJiYgXCJcIiAhPT0gdCA/IFwibnVtYmVyXCIgPT0gdHlwZW9mIHQgPyBbdCA+PiAxNiwgMjU1ICYgdCA+PiA4LCAyNTUgJiB0XSA6IChcIixcIiA9PT0gdC5jaGFyQXQodC5sZW5ndGggLSAxKSAmJiAodCA9IHQuc3Vic3RyKDAsIHQubGVuZ3RoIC0gMSkpLCBuZVt0XSA/IG5lW3RdIDogXCIjXCIgPT09IHQuY2hhckF0KDApID8gKDQgPT09IHQubGVuZ3RoICYmIChlID0gdC5jaGFyQXQoMSksIGkgPSB0LmNoYXJBdCgyKSwgcyA9IHQuY2hhckF0KDMpLCB0ID0gXCIjXCIgKyBlICsgZSArIGkgKyBpICsgcyArIHMpLCB0ID0gcGFyc2VJbnQodC5zdWJzdHIoMSksIDE2KSwgW3QgPj4gMTYsIDI1NSAmIHQgPj4gOCwgMjU1ICYgdF0pIDogXCJoc2xcIiA9PT0gdC5zdWJzdHIoMCwgMykgPyAodCA9IHQubWF0Y2goZCksIHIgPSBOdW1iZXIodFswXSkgJSAzNjAgLyAzNjAsIG4gPSBOdW1iZXIodFsxXSkgLyAxMDAsIGEgPSBOdW1iZXIodFsyXSkgLyAxMDAsIGkgPSAuNSA+PSBhID8gYSAqIChuICsgMSkgOiBhICsgbiAtIGEgKiBuLCBlID0gMiAqIGEgLSBpLCB0Lmxlbmd0aCA+IDMgJiYgKHRbM10gPSBOdW1iZXIodFszXSkpLCB0WzBdID0gYWUociArIDEgLyAzLCBlLCBpKSwgdFsxXSA9IGFlKHIsIGUsIGkpLCB0WzJdID0gYWUociAtIDEgLyAzLCBlLCBpKSwgdCkgOiAodCA9IHQubWF0Y2goZCkgfHwgbmUudHJhbnNwYXJlbnQsIHRbMF0gPSBOdW1iZXIodFswXSksIHRbMV0gPSBOdW1iZXIodFsxXSksIHRbMl0gPSBOdW1iZXIodFsyXSksIHQubGVuZ3RoID4gMyAmJiAodFszXSA9IE51bWJlcih0WzNdKSksIHQpKSA6IG5lLmJsYWNrXG4gICAgICAgIH0sIGxlID0gXCIoPzpcXFxcYig/Oig/OnJnYnxyZ2JhfGhzbHxoc2xhKVxcXFwoLis/XFxcXCkpfFxcXFxCIy4rP1xcXFxiXCI7XG4gICAgICAgIGZvciAobCBpbiBuZSlsZSArPSBcInxcIiArIGwgKyBcIlxcXFxiXCI7XG4gICAgICAgIGxlID0gUmVnRXhwKGxlICsgXCIpXCIsIFwiZ2lcIik7XG4gICAgICAgIHZhciBoZSA9IGZ1bmN0aW9uICh0LCBlLCBpLCBzKSB7XG4gICAgICAgICAgICBpZiAobnVsbCA9PSB0KXJldHVybiBmdW5jdGlvbiAodCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgdmFyIHIsIG4gPSBlID8gKHQubWF0Y2gobGUpIHx8IFtcIlwiXSlbMF0gOiBcIlwiLCBhID0gdC5zcGxpdChuKS5qb2luKFwiXCIpLm1hdGNoKGcpIHx8IFtdLCBvID0gdC5zdWJzdHIoMCwgdC5pbmRleE9mKGFbMF0pKSwgbCA9IFwiKVwiID09PSB0LmNoYXJBdCh0Lmxlbmd0aCAtIDEpID8gXCIpXCIgOiBcIlwiLCBoID0gLTEgIT09IHQuaW5kZXhPZihcIiBcIikgPyBcIiBcIiA6IFwiLFwiLCB1ID0gYS5sZW5ndGgsIF8gPSB1ID4gMCA/IGFbMF0ucmVwbGFjZShkLCBcIlwiKSA6IFwiXCI7XG4gICAgICAgICAgICByZXR1cm4gdSA/IHIgPSBlID8gZnVuY3Rpb24gKHQpIHtcbiAgICAgICAgICAgICAgICB2YXIgZSwgcCwgZiwgYztcbiAgICAgICAgICAgICAgICBpZiAoXCJudW1iZXJcIiA9PSB0eXBlb2YgdCl0ICs9IF87IGVsc2UgaWYgKHMgJiYgRC50ZXN0KHQpKSB7XG4gICAgICAgICAgICAgICAgICAgIGZvciAoYyA9IHQucmVwbGFjZShELCBcInxcIikuc3BsaXQoXCJ8XCIpLCBmID0gMDsgYy5sZW5ndGggPiBmOyBmKyspY1tmXSA9IHIoY1tmXSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBjLmpvaW4oXCIsXCIpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChlID0gKHQubWF0Y2gobGUpIHx8IFtuXSlbMF0sIHAgPSB0LnNwbGl0KGUpLmpvaW4oXCJcIikubWF0Y2goZykgfHwgW10sIGYgPSBwLmxlbmd0aCwgdSA+IGYtLSlmb3IgKDsgdSA+ICsrZjspcFtmXSA9IGkgPyBwWzAgfCAoZiAtIDEpIC8gMl0gOiBhW2ZdO1xuICAgICAgICAgICAgICAgIHJldHVybiBvICsgcC5qb2luKGgpICsgaCArIGUgKyBsICsgKC0xICE9PSB0LmluZGV4T2YoXCJpbnNldFwiKSA/IFwiIGluc2V0XCIgOiBcIlwiKVxuICAgICAgICAgICAgfSA6IGZ1bmN0aW9uICh0KSB7XG4gICAgICAgICAgICAgICAgdmFyIGUsIG4sIHA7XG4gICAgICAgICAgICAgICAgaWYgKFwibnVtYmVyXCIgPT0gdHlwZW9mIHQpdCArPSBfOyBlbHNlIGlmIChzICYmIEQudGVzdCh0KSkge1xuICAgICAgICAgICAgICAgICAgICBmb3IgKG4gPSB0LnJlcGxhY2UoRCwgXCJ8XCIpLnNwbGl0KFwifFwiKSwgcCA9IDA7IG4ubGVuZ3RoID4gcDsgcCsrKW5bcF0gPSByKG5bcF0pO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbi5qb2luKFwiLFwiKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoZSA9IHQubWF0Y2goZykgfHwgW10sIHAgPSBlLmxlbmd0aCwgdSA+IHAtLSlmb3IgKDsgdSA+ICsrcDspZVtwXSA9IGkgPyBlWzAgfCAocCAtIDEpIC8gMl0gOiBhW3BdO1xuICAgICAgICAgICAgICAgIHJldHVybiBvICsgZS5qb2luKGgpICsgbFxuICAgICAgICAgICAgfSA6IGZ1bmN0aW9uICh0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgdWUgPSBmdW5jdGlvbiAodCkge1xuICAgICAgICAgICAgcmV0dXJuIHQgPSB0LnNwbGl0KFwiLFwiKSwgZnVuY3Rpb24gKGUsIGksIHMsIHIsIG4sIGEsIG8pIHtcbiAgICAgICAgICAgICAgICB2YXIgbCwgaCA9IChpICsgXCJcIikuc3BsaXQoXCIgXCIpO1xuICAgICAgICAgICAgICAgIGZvciAobyA9IHt9LCBsID0gMDsgNCA+IGw7IGwrKylvW3RbbF1dID0gaFtsXSA9IGhbbF0gfHwgaFsobCAtIDEpIC8gMiA+PiAwXTtcbiAgICAgICAgICAgICAgICByZXR1cm4gci5wYXJzZShlLCBvLCBuLCBhKVxuICAgICAgICAgICAgfVxuICAgICAgICB9LCBfZSA9IChFLl9zZXRQbHVnaW5SYXRpbyA9IGZ1bmN0aW9uICh0KSB7XG4gICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXRSYXRpbyh0KTtcbiAgICAgICAgICAgIGZvciAodmFyIGUsIGksIHMsIHIsIG4gPSB0aGlzLmRhdGEsIGEgPSBuLnByb3h5LCBvID0gbi5maXJzdE1QVCwgbCA9IDFlLTY7IG87KWUgPSBhW28udl0sIG8uciA/IGUgPSBlID4gMCA/IDAgfCBlICsgLjUgOiAwIHwgZSAtIC41IDogbCA+IGUgJiYgZSA+IC1sICYmIChlID0gMCksIG8udFtvLnBdID0gZSwgbyA9IG8uX25leHQ7XG4gICAgICAgICAgICBpZiAobi5hdXRvUm90YXRlICYmIChuLmF1dG9Sb3RhdGUucm90YXRpb24gPSBhLnJvdGF0aW9uKSwgMSA9PT0gdClmb3IgKG8gPSBuLmZpcnN0TVBUOyBvOykge1xuICAgICAgICAgICAgICAgIGlmIChpID0gby50LCBpLnR5cGUpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKDEgPT09IGkudHlwZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChyID0gaS54czAgKyBpLnMgKyBpLnhzMSwgcyA9IDE7IGkubCA+IHM7IHMrKylyICs9IGlbXCJ4blwiICsgc10gKyBpW1wieHNcIiArIChzICsgMSldO1xuICAgICAgICAgICAgICAgICAgICAgICAgaS5lID0gclxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIGkuZSA9IGkucyArIGkueHMwO1xuICAgICAgICAgICAgICAgIG8gPSBvLl9uZXh0XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIGZ1bmN0aW9uICh0LCBlLCBpLCBzLCByKSB7XG4gICAgICAgICAgICB0aGlzLnQgPSB0LCB0aGlzLnAgPSBlLCB0aGlzLnYgPSBpLCB0aGlzLnIgPSByLCBzICYmIChzLl9wcmV2ID0gdGhpcywgdGhpcy5fbmV4dCA9IHMpXG4gICAgICAgIH0pLCBwZSA9IChFLl9wYXJzZVRvUHJveHkgPSBmdW5jdGlvbiAodCwgZSwgaSwgcywgciwgbikge1xuICAgICAgICAgICAgdmFyIGEsIG8sIGwsIGgsIHUsIF8gPSBzLCBwID0ge30sIGYgPSB7fSwgYyA9IGkuX3RyYW5zZm9ybSwgZCA9IE47XG4gICAgICAgICAgICBmb3IgKGkuX3RyYW5zZm9ybSA9IG51bGwsIE4gPSBlLCBzID0gdSA9IGkucGFyc2UodCwgZSwgcywgciksIE4gPSBkLCBuICYmIChpLl90cmFuc2Zvcm0gPSBjLCBfICYmIChfLl9wcmV2ID0gbnVsbCwgXy5fcHJldiAmJiAoXy5fcHJldi5fbmV4dCA9IG51bGwpKSk7IHMgJiYgcyAhPT0gXzspIHtcbiAgICAgICAgICAgICAgICBpZiAoMSA+PSBzLnR5cGUgJiYgKG8gPSBzLnAsIGZbb10gPSBzLnMgKyBzLmMsIHBbb10gPSBzLnMsIG4gfHwgKGggPSBuZXcgX2UocywgXCJzXCIsIG8sIGgsIHMuciksIHMuYyA9IDApLCAxID09PSBzLnR5cGUpKWZvciAoYSA9IHMubDsgLS1hID4gMDspbCA9IFwieG5cIiArIGEsIG8gPSBzLnAgKyBcIl9cIiArIGwsIGZbb10gPSBzLmRhdGFbbF0sIHBbb10gPSBzW2xdLCBuIHx8IChoID0gbmV3IF9lKHMsIGwsIG8sIGgsIHMucnhwW2xdKSk7XG4gICAgICAgICAgICAgICAgcyA9IHMuX25leHRcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybntwcm94eTogcCwgZW5kOiBmLCBmaXJzdE1QVDogaCwgcHQ6IHV9XG4gICAgICAgIH0sIEUuQ1NTUHJvcFR3ZWVuID0gZnVuY3Rpb24gKHQsIGUsIHMsIHIsIGEsIG8sIGwsIGgsIHUsIF8sIHApIHtcbiAgICAgICAgICAgIHRoaXMudCA9IHQsIHRoaXMucCA9IGUsIHRoaXMucyA9IHMsIHRoaXMuYyA9IHIsIHRoaXMubiA9IGwgfHwgZSwgdCBpbnN0YW5jZW9mIHBlIHx8IG4ucHVzaCh0aGlzLm4pLCB0aGlzLnIgPSBoLCB0aGlzLnR5cGUgPSBvIHx8IDAsIHUgJiYgKHRoaXMucHIgPSB1LCBpID0gITApLCB0aGlzLmIgPSB2b2lkIDAgPT09IF8gPyBzIDogXywgdGhpcy5lID0gdm9pZCAwID09PSBwID8gcyArIHIgOiBwLCBhICYmICh0aGlzLl9uZXh0ID0gYSwgYS5fcHJldiA9IHRoaXMpXG4gICAgICAgIH0pLCBmZSA9IGEucGFyc2VDb21wbGV4ID0gZnVuY3Rpb24gKHQsIGUsIGksIHMsIHIsIG4sIGEsIG8sIGwsIHUpIHtcbiAgICAgICAgICAgIGkgPSBpIHx8IG4gfHwgXCJcIiwgYSA9IG5ldyBwZSh0LCBlLCAwLCAwLCBhLCB1ID8gMiA6IDEsIG51bGwsICExLCBvLCBpLCBzKSwgcyArPSBcIlwiO1xuICAgICAgICAgICAgdmFyIF8sIHAsIGYsIGMsIGcsIHYsIHksIFQsIHgsIHcsIFAsIFMsIFIgPSBpLnNwbGl0KFwiLCBcIikuam9pbihcIixcIikuc3BsaXQoXCIgXCIpLCBrID0gcy5zcGxpdChcIiwgXCIpLmpvaW4oXCIsXCIpLnNwbGl0KFwiIFwiKSwgQyA9IFIubGVuZ3RoLCBBID0gaCAhPT0gITE7XG4gICAgICAgICAgICBmb3IgKCgtMSAhPT0gcy5pbmRleE9mKFwiLFwiKSB8fCAtMSAhPT0gaS5pbmRleE9mKFwiLFwiKSkgJiYgKFIgPSBSLmpvaW4oXCIgXCIpLnJlcGxhY2UoRCwgXCIsIFwiKS5zcGxpdChcIiBcIiksIGsgPSBrLmpvaW4oXCIgXCIpLnJlcGxhY2UoRCwgXCIsIFwiKS5zcGxpdChcIiBcIiksIEMgPSBSLmxlbmd0aCksIEMgIT09IGsubGVuZ3RoICYmIChSID0gKG4gfHwgXCJcIikuc3BsaXQoXCIgXCIpLCBDID0gUi5sZW5ndGgpLCBhLnBsdWdpbiA9IGwsIGEuc2V0UmF0aW8gPSB1LCBfID0gMDsgQyA+IF87IF8rKylpZiAoYyA9IFJbX10sIGcgPSBrW19dLCBUID0gcGFyc2VGbG9hdChjKSwgVCB8fCAwID09PSBUKWEuYXBwZW5kWHRyYShcIlwiLCBULCBpZShnLCBUKSwgZy5yZXBsYWNlKG0sIFwiXCIpLCBBICYmIC0xICE9PSBnLmluZGV4T2YoXCJweFwiKSwgITApOyBlbHNlIGlmIChyICYmIChcIiNcIiA9PT0gYy5jaGFyQXQoMCkgfHwgbmVbY10gfHwgYi50ZXN0KGMpKSlTID0gXCIsXCIgPT09IGcuY2hhckF0KGcubGVuZ3RoIC0gMSkgPyBcIiksXCIgOiBcIilcIiwgYyA9IG9lKGMpLCBnID0gb2UoZyksIHggPSBjLmxlbmd0aCArIGcubGVuZ3RoID4gNiwgeCAmJiAheiAmJiAwID09PSBnWzNdID8gKGFbXCJ4c1wiICsgYS5sXSArPSBhLmwgPyBcIiB0cmFuc3BhcmVudFwiIDogXCJ0cmFuc3BhcmVudFwiLCBhLmUgPSBhLmUuc3BsaXQoa1tfXSkuam9pbihcInRyYW5zcGFyZW50XCIpKSA6ICh6IHx8ICh4ID0gITEpLCBhLmFwcGVuZFh0cmEoeCA/IFwicmdiYShcIiA6IFwicmdiKFwiLCBjWzBdLCBnWzBdIC0gY1swXSwgXCIsXCIsICEwLCAhMCkuYXBwZW5kWHRyYShcIlwiLCBjWzFdLCBnWzFdIC0gY1sxXSwgXCIsXCIsICEwKS5hcHBlbmRYdHJhKFwiXCIsIGNbMl0sIGdbMl0gLSBjWzJdLCB4ID8gXCIsXCIgOiBTLCAhMCksIHggJiYgKGMgPSA0ID4gYy5sZW5ndGggPyAxIDogY1szXSwgYS5hcHBlbmRYdHJhKFwiXCIsIGMsICg0ID4gZy5sZW5ndGggPyAxIDogZ1szXSkgLSBjLCBTLCAhMSkpKTsgZWxzZSBpZiAodiA9IGMubWF0Y2goZCkpIHtcbiAgICAgICAgICAgICAgICBpZiAoeSA9IGcubWF0Y2gobSksICF5IHx8IHkubGVuZ3RoICE9PSB2Lmxlbmd0aClyZXR1cm4gYTtcbiAgICAgICAgICAgICAgICBmb3IgKGYgPSAwLCBwID0gMDsgdi5sZW5ndGggPiBwOyBwKyspUCA9IHZbcF0sIHcgPSBjLmluZGV4T2YoUCwgZiksIGEuYXBwZW5kWHRyYShjLnN1YnN0cihmLCB3IC0gZiksIE51bWJlcihQKSwgaWUoeVtwXSwgUCksIFwiXCIsIEEgJiYgXCJweFwiID09PSBjLnN1YnN0cih3ICsgUC5sZW5ndGgsIDIpLCAwID09PSBwKSwgZiA9IHcgKyBQLmxlbmd0aDtcbiAgICAgICAgICAgICAgICBhW1wieHNcIiArIGEubF0gKz0gYy5zdWJzdHIoZilcbiAgICAgICAgICAgIH0gZWxzZSBhW1wieHNcIiArIGEubF0gKz0gYS5sID8gXCIgXCIgKyBjIDogYztcbiAgICAgICAgICAgIGlmICgtMSAhPT0gcy5pbmRleE9mKFwiPVwiKSAmJiBhLmRhdGEpIHtcbiAgICAgICAgICAgICAgICBmb3IgKFMgPSBhLnhzMCArIGEuZGF0YS5zLCBfID0gMTsgYS5sID4gXzsgXysrKVMgKz0gYVtcInhzXCIgKyBfXSArIGEuZGF0YVtcInhuXCIgKyBfXTtcbiAgICAgICAgICAgICAgICBhLmUgPSBTICsgYVtcInhzXCIgKyBfXVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGEubCB8fCAoYS50eXBlID0gLTEsIGEueHMwID0gYS5lKSwgYS54Zmlyc3QgfHwgYVxuICAgICAgICB9LCBjZSA9IDk7XG4gICAgICAgIGZvciAobCA9IHBlLnByb3RvdHlwZSwgbC5sID0gbC5wciA9IDA7IC0tY2UgPiAwOylsW1wieG5cIiArIGNlXSA9IDAsIGxbXCJ4c1wiICsgY2VdID0gXCJcIjtcbiAgICAgICAgbC54czAgPSBcIlwiLCBsLl9uZXh0ID0gbC5fcHJldiA9IGwueGZpcnN0ID0gbC5kYXRhID0gbC5wbHVnaW4gPSBsLnNldFJhdGlvID0gbC5yeHAgPSBudWxsLCBsLmFwcGVuZFh0cmEgPSBmdW5jdGlvbiAodCwgZSwgaSwgcywgciwgbikge1xuICAgICAgICAgICAgdmFyIGEgPSB0aGlzLCBvID0gYS5sO1xuICAgICAgICAgICAgcmV0dXJuIGFbXCJ4c1wiICsgb10gKz0gbiAmJiBvID8gXCIgXCIgKyB0IDogdCB8fCBcIlwiLCBpIHx8IDAgPT09IG8gfHwgYS5wbHVnaW4gPyAoYS5sKyssIGEudHlwZSA9IGEuc2V0UmF0aW8gPyAyIDogMSwgYVtcInhzXCIgKyBhLmxdID0gcyB8fCBcIlwiLCBvID4gMCA/IChhLmRhdGFbXCJ4blwiICsgb10gPSBlICsgaSwgYS5yeHBbXCJ4blwiICsgb10gPSByLCBhW1wieG5cIiArIG9dID0gZSwgYS5wbHVnaW4gfHwgKGEueGZpcnN0ID0gbmV3IHBlKGEsIFwieG5cIiArIG8sIGUsIGksIGEueGZpcnN0IHx8IGEsIDAsIGEubiwgciwgYS5wciksIGEueGZpcnN0LnhzMCA9IDApLCBhKSA6IChhLmRhdGEgPSB7czogZSArIGl9LCBhLnJ4cCA9IHt9LCBhLnMgPSBlLCBhLmMgPSBpLCBhLnIgPSByLCBhKSkgOiAoYVtcInhzXCIgKyBvXSArPSBlICsgKHMgfHwgXCJcIiksIGEpXG4gICAgICAgIH07XG4gICAgICAgIHZhciBkZSA9IGZ1bmN0aW9uICh0LCBlKSB7XG4gICAgICAgICAgICBlID0gZSB8fCB7fSwgdGhpcy5wID0gZS5wcmVmaXggPyBxKHQpIHx8IHQgOiB0LCBvW3RdID0gb1t0aGlzLnBdID0gdGhpcywgdGhpcy5mb3JtYXQgPSBlLmZvcm1hdHRlciB8fCBoZShlLmRlZmF1bHRWYWx1ZSwgZS5jb2xvciwgZS5jb2xsYXBzaWJsZSwgZS5tdWx0aSksIGUucGFyc2VyICYmICh0aGlzLnBhcnNlID0gZS5wYXJzZXIpLCB0aGlzLmNscnMgPSBlLmNvbG9yLCB0aGlzLm11bHRpID0gZS5tdWx0aSwgdGhpcy5rZXl3b3JkID0gZS5rZXl3b3JkLCB0aGlzLmRmbHQgPSBlLmRlZmF1bHRWYWx1ZSwgdGhpcy5wciA9IGUucHJpb3JpdHkgfHwgMFxuICAgICAgICB9LCBtZSA9IEUuX3JlZ2lzdGVyQ29tcGxleFNwZWNpYWxQcm9wID0gZnVuY3Rpb24gKHQsIGUsIGkpIHtcbiAgICAgICAgICAgIFwib2JqZWN0XCIgIT0gdHlwZW9mIGUgJiYgKGUgPSB7cGFyc2VyOiBpfSk7XG4gICAgICAgICAgICB2YXIgcywgciwgbiA9IHQuc3BsaXQoXCIsXCIpLCBhID0gZS5kZWZhdWx0VmFsdWU7XG4gICAgICAgICAgICBmb3IgKGkgPSBpIHx8IFthXSwgcyA9IDA7IG4ubGVuZ3RoID4gczsgcysrKWUucHJlZml4ID0gMCA9PT0gcyAmJiBlLnByZWZpeCwgZS5kZWZhdWx0VmFsdWUgPSBpW3NdIHx8IGEsIHIgPSBuZXcgZGUobltzXSwgZSlcbiAgICAgICAgfSwgZ2UgPSBmdW5jdGlvbiAodCkge1xuICAgICAgICAgICAgaWYgKCFvW3RdKSB7XG4gICAgICAgICAgICAgICAgdmFyIGUgPSB0LmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpICsgdC5zdWJzdHIoMSkgKyBcIlBsdWdpblwiO1xuICAgICAgICAgICAgICAgIG1lKHQsIHtwYXJzZXI6IGZ1bmN0aW9uICh0LCBpLCBzLCByLCBuLCBhLCBsKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBoID0gKHdpbmRvdy5HcmVlblNvY2tHbG9iYWxzIHx8IHdpbmRvdykuY29tLmdyZWVuc29jay5wbHVnaW5zW2VdO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gaCA/IChoLl9jc3NSZWdpc3RlcigpLCBvW3NdLnBhcnNlKHQsIGksIHMsIHIsIG4sIGEsIGwpKSA6IChCKFwiRXJyb3I6IFwiICsgZSArIFwiIGpzIGZpbGUgbm90IGxvYWRlZC5cIiksIG4pXG4gICAgICAgICAgICAgICAgfX0pXG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIGwgPSBkZS5wcm90b3R5cGUsIGwucGFyc2VDb21wbGV4ID0gZnVuY3Rpb24gKHQsIGUsIGksIHMsIHIsIG4pIHtcbiAgICAgICAgICAgIHZhciBhLCBvLCBsLCBoLCB1LCBfLCBwID0gdGhpcy5rZXl3b3JkO1xuICAgICAgICAgICAgaWYgKHRoaXMubXVsdGkgJiYgKEQudGVzdChpKSB8fCBELnRlc3QoZSkgPyAobyA9IGUucmVwbGFjZShELCBcInxcIikuc3BsaXQoXCJ8XCIpLCBsID0gaS5yZXBsYWNlKEQsIFwifFwiKS5zcGxpdChcInxcIikpIDogcCAmJiAobyA9IFtlXSwgbCA9IFtpXSkpLCBsKSB7XG4gICAgICAgICAgICAgICAgZm9yIChoID0gbC5sZW5ndGggPiBvLmxlbmd0aCA/IGwubGVuZ3RoIDogby5sZW5ndGgsIGEgPSAwOyBoID4gYTsgYSsrKWUgPSBvW2FdID0gb1thXSB8fCB0aGlzLmRmbHQsIGkgPSBsW2FdID0gbFthXSB8fCB0aGlzLmRmbHQsIHAgJiYgKHUgPSBlLmluZGV4T2YocCksIF8gPSBpLmluZGV4T2YocCksIHUgIT09IF8gJiYgKGkgPSAtMSA9PT0gXyA/IGwgOiBvLCBpW2FdICs9IFwiIFwiICsgcCkpO1xuICAgICAgICAgICAgICAgIGUgPSBvLmpvaW4oXCIsIFwiKSwgaSA9IGwuam9pbihcIiwgXCIpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZmUodCwgdGhpcy5wLCBlLCBpLCB0aGlzLmNscnMsIHRoaXMuZGZsdCwgcywgdGhpcy5wciwgciwgbilcbiAgICAgICAgfSwgbC5wYXJzZSA9IGZ1bmN0aW9uICh0LCBlLCBpLCBzLCBuLCBhKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5wYXJzZUNvbXBsZXgodC5zdHlsZSwgdGhpcy5mb3JtYXQoUSh0LCB0aGlzLnAsIHIsICExLCB0aGlzLmRmbHQpKSwgdGhpcy5mb3JtYXQoZSksIG4sIGEpXG4gICAgICAgIH0sIGEucmVnaXN0ZXJTcGVjaWFsUHJvcCA9IGZ1bmN0aW9uICh0LCBlLCBpKSB7XG4gICAgICAgICAgICBtZSh0LCB7cGFyc2VyOiBmdW5jdGlvbiAodCwgcywgciwgbiwgYSwgbykge1xuICAgICAgICAgICAgICAgIHZhciBsID0gbmV3IHBlKHQsIHIsIDAsIDAsIGEsIDIsIHIsICExLCBpKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gbC5wbHVnaW4gPSBvLCBsLnNldFJhdGlvID0gZSh0LCBzLCBuLl90d2VlbiwgciksIGxcbiAgICAgICAgICAgIH0sIHByaW9yaXR5OiBpfSlcbiAgICAgICAgfTtcbiAgICAgICAgdmFyIHZlID0gXCJzY2FsZVgsc2NhbGVZLHNjYWxlWix4LHkseixza2V3WCxyb3RhdGlvbixyb3RhdGlvblgscm90YXRpb25ZLHBlcnNwZWN0aXZlXCIuc3BsaXQoXCIsXCIpLCB5ZSA9IHEoXCJ0cmFuc2Zvcm1cIiksIFRlID0gaiArIFwidHJhbnNmb3JtXCIsIHhlID0gcShcInRyYW5zZm9ybU9yaWdpblwiKSwgd2UgPSBudWxsICE9PSBxKFwicGVyc3BlY3RpdmVcIiksIGJlID0gZnVuY3Rpb24gKHQsIGUsIGksIHMpIHtcbiAgICAgICAgICAgIGlmICh0Ll9nc1RyYW5zZm9ybSAmJiBpICYmICFzKXJldHVybiB0Ll9nc1RyYW5zZm9ybTtcbiAgICAgICAgICAgIHZhciByLCBuLCBvLCBsLCBoLCB1LCBfLCBwLCBmLCBjLCBkLCBtLCBnLCB2ID0gaSA/IHQuX2dzVHJhbnNmb3JtIHx8IHtza2V3WTogMH0gOiB7c2tld1k6IDB9LCB5ID0gMCA+IHYuc2NhbGVYLCBUID0gMmUtNSwgeCA9IDFlNSwgdyA9IDE3OS45OSwgYiA9IHcgKiBNLCBQID0gd2UgPyBwYXJzZUZsb2F0KFEodCwgeGUsIGUsICExLCBcIjAgMCAwXCIpLnNwbGl0KFwiIFwiKVsyXSkgfHwgdi56T3JpZ2luIHx8IDAgOiAwO1xuICAgICAgICAgICAgZm9yICh5ZSA/IHIgPSBRKHQsIFRlLCBlLCAhMCkgOiB0LmN1cnJlbnRTdHlsZSAmJiAociA9IHQuY3VycmVudFN0eWxlLmZpbHRlci5tYXRjaChBKSwgciA9IHIgJiYgNCA9PT0gci5sZW5ndGggPyBbclswXS5zdWJzdHIoNCksIE51bWJlcihyWzJdLnN1YnN0cig0KSksIE51bWJlcihyWzFdLnN1YnN0cig0KSksIHJbM10uc3Vic3RyKDQpLCB2LnggfHwgMCwgdi55IHx8IDBdLmpvaW4oXCIsXCIpIDogXCJcIiksIG4gPSAociB8fCBcIlwiKS5tYXRjaCgvKD86XFwtfFxcYilbXFxkXFwtXFwuZV0rXFxiL2dpKSB8fCBbXSwgbyA9IG4ubGVuZ3RoOyAtLW8gPiAtMTspbCA9IE51bWJlcihuW29dKSwgbltvXSA9IChoID0gbCAtIChsIHw9IDApKSA/ICgwIHwgaCAqIHggKyAoMCA+IGggPyAtLjUgOiAuNSkpIC8geCArIGwgOiBsO1xuICAgICAgICAgICAgaWYgKDE2ID09PSBuLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIHZhciBTID0gbls4XSwgUiA9IG5bOV0sIGsgPSBuWzEwXSwgQyA9IG5bMTJdLCBPID0gblsxM10sIEQgPSBuWzE0XTtcbiAgICAgICAgICAgICAgICBpZiAodi56T3JpZ2luICYmIChEID0gLXYuek9yaWdpbiwgQyA9IFMgKiBEIC0gblsxMl0sIE8gPSBSICogRCAtIG5bMTNdLCBEID0gayAqIEQgKyB2LnpPcmlnaW4gLSBuWzE0XSksICFpIHx8IHMgfHwgbnVsbCA9PSB2LnJvdGF0aW9uWCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgTiwgWCwgRiwgSSwgRSwgWSwgeiwgVSA9IG5bMF0sIEIgPSBuWzFdLCBqID0gblsyXSwgViA9IG5bM10sIHEgPSBuWzRdLCBXID0gbls1XSwgWiA9IG5bNl0sIEggPSBuWzddLCAkID0gblsxMV0sIEcgPSBNYXRoLmF0YW4yKFosIGspLCBLID0gLWIgPiBHIHx8IEcgPiBiO1xuICAgICAgICAgICAgICAgICAgICB2LnJvdGF0aW9uWCA9IEcgKiBMLCBHICYmIChJID0gTWF0aC5jb3MoLUcpLCBFID0gTWF0aC5zaW4oLUcpLCBOID0gcSAqIEkgKyBTICogRSwgWCA9IFcgKiBJICsgUiAqIEUsIEYgPSBaICogSSArIGsgKiBFLCBTID0gcSAqIC1FICsgUyAqIEksIFIgPSBXICogLUUgKyBSICogSSwgayA9IFogKiAtRSArIGsgKiBJLCAkID0gSCAqIC1FICsgJCAqIEksIHEgPSBOLCBXID0gWCwgWiA9IEYpLCBHID0gTWF0aC5hdGFuMihTLCBVKSwgdi5yb3RhdGlvblkgPSBHICogTCwgRyAmJiAoWSA9IC1iID4gRyB8fCBHID4gYiwgSSA9IE1hdGguY29zKC1HKSwgRSA9IE1hdGguc2luKC1HKSwgTiA9IFUgKiBJIC0gUyAqIEUsIFggPSBCICogSSAtIFIgKiBFLCBGID0gaiAqIEkgLSBrICogRSwgUiA9IEIgKiBFICsgUiAqIEksIGsgPSBqICogRSArIGsgKiBJLCAkID0gViAqIEUgKyAkICogSSwgVSA9IE4sIEIgPSBYLCBqID0gRiksIEcgPSBNYXRoLmF0YW4yKEIsIFcpLCB2LnJvdGF0aW9uID0gRyAqIEwsIEcgJiYgKHogPSAtYiA+IEcgfHwgRyA+IGIsIEkgPSBNYXRoLmNvcygtRyksIEUgPSBNYXRoLnNpbigtRyksIFUgPSBVICogSSArIHEgKiBFLCBYID0gQiAqIEkgKyBXICogRSwgVyA9IEIgKiAtRSArIFcgKiBJLCBaID0gaiAqIC1FICsgWiAqIEksIEIgPSBYKSwgeiAmJiBLID8gdi5yb3RhdGlvbiA9IHYucm90YXRpb25YID0gMCA6IHogJiYgWSA/IHYucm90YXRpb24gPSB2LnJvdGF0aW9uWSA9IDAgOiBZICYmIEsgJiYgKHYucm90YXRpb25ZID0gdi5yb3RhdGlvblggPSAwKSwgdi5zY2FsZVggPSAoMCB8IE1hdGguc3FydChVICogVSArIEIgKiBCKSAqIHggKyAuNSkgLyB4LCB2LnNjYWxlWSA9ICgwIHwgTWF0aC5zcXJ0KFcgKiBXICsgUiAqIFIpICogeCArIC41KSAvIHgsIHYuc2NhbGVaID0gKDAgfCBNYXRoLnNxcnQoWiAqIFogKyBrICogaykgKiB4ICsgLjUpIC8geCwgdi5za2V3WCA9IDAsIHYucGVyc3BlY3RpdmUgPSAkID8gMSAvICgwID4gJCA/IC0kIDogJCkgOiAwLCB2LnggPSBDLCB2LnkgPSBPLCB2LnogPSBEXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIGlmICghKHdlICYmICFzICYmIG4ubGVuZ3RoICYmIHYueCA9PT0gbls0XSAmJiB2LnkgPT09IG5bNV0gJiYgKHYucm90YXRpb25YIHx8IHYucm90YXRpb25ZKSB8fCB2b2lkIDAgIT09IHYueCAmJiBcIm5vbmVcIiA9PT0gUSh0LCBcImRpc3BsYXlcIiwgZSkpKSB7XG4gICAgICAgICAgICAgICAgdmFyIEogPSBuLmxlbmd0aCA+PSA2LCB0ZSA9IEogPyBuWzBdIDogMSwgZWUgPSBuWzFdIHx8IDAsIGllID0gblsyXSB8fCAwLCBzZSA9IEogPyBuWzNdIDogMTtcbiAgICAgICAgICAgICAgICB2LnggPSBuWzRdIHx8IDAsIHYueSA9IG5bNV0gfHwgMCwgdSA9IE1hdGguc3FydCh0ZSAqIHRlICsgZWUgKiBlZSksIF8gPSBNYXRoLnNxcnQoc2UgKiBzZSArIGllICogaWUpLCBwID0gdGUgfHwgZWUgPyBNYXRoLmF0YW4yKGVlLCB0ZSkgKiBMIDogdi5yb3RhdGlvbiB8fCAwLCBmID0gaWUgfHwgc2UgPyBNYXRoLmF0YW4yKGllLCBzZSkgKiBMICsgcCA6IHYuc2tld1ggfHwgMCwgYyA9IHUgLSBNYXRoLmFicyh2LnNjYWxlWCB8fCAwKSwgZCA9IF8gLSBNYXRoLmFicyh2LnNjYWxlWSB8fCAwKSwgTWF0aC5hYnMoZikgPiA5MCAmJiAyNzAgPiBNYXRoLmFicyhmKSAmJiAoeSA/ICh1ICo9IC0xLCBmICs9IDAgPj0gcCA/IDE4MCA6IC0xODAsIHAgKz0gMCA+PSBwID8gMTgwIDogLTE4MCkgOiAoXyAqPSAtMSwgZiArPSAwID49IGYgPyAxODAgOiAtMTgwKSksIG0gPSAocCAtIHYucm90YXRpb24pICUgMTgwLCBnID0gKGYgLSB2LnNrZXdYKSAlIDE4MCwgKHZvaWQgMCA9PT0gdi5za2V3WCB8fCBjID4gVCB8fCAtVCA+IGMgfHwgZCA+IFQgfHwgLVQgPiBkIHx8IG0gPiAtdyAmJiB3ID4gbSAmJiBmYWxzZSB8IG0gKiB4IHx8IGcgPiAtdyAmJiB3ID4gZyAmJiBmYWxzZSB8IGcgKiB4KSAmJiAodi5zY2FsZVggPSB1LCB2LnNjYWxlWSA9IF8sIHYucm90YXRpb24gPSBwLCB2LnNrZXdYID0gZiksIHdlICYmICh2LnJvdGF0aW9uWCA9IHYucm90YXRpb25ZID0gdi56ID0gMCwgdi5wZXJzcGVjdGl2ZSA9IHBhcnNlRmxvYXQoYS5kZWZhdWx0VHJhbnNmb3JtUGVyc3BlY3RpdmUpIHx8IDAsIHYuc2NhbGVaID0gMSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHYuek9yaWdpbiA9IFA7XG4gICAgICAgICAgICBmb3IgKG8gaW4gdilUID4gdltvXSAmJiB2W29dID4gLVQgJiYgKHZbb10gPSAwKTtcbiAgICAgICAgICAgIHJldHVybiBpICYmICh0Ll9nc1RyYW5zZm9ybSA9IHYpLCB2XG4gICAgICAgIH0sIFBlID0gZnVuY3Rpb24gKHQpIHtcbiAgICAgICAgICAgIHZhciBlLCBpLCBzID0gdGhpcy5kYXRhLCByID0gLXMucm90YXRpb24gKiBNLCBuID0gciArIHMuc2tld1ggKiBNLCBhID0gMWU1LCBvID0gKDAgfCBNYXRoLmNvcyhyKSAqIHMuc2NhbGVYICogYSkgLyBhLCBsID0gKDAgfCBNYXRoLnNpbihyKSAqIHMuc2NhbGVYICogYSkgLyBhLCBoID0gKDAgfCBNYXRoLnNpbihuKSAqIC1zLnNjYWxlWSAqIGEpIC8gYSwgdSA9ICgwIHwgTWF0aC5jb3MobikgKiBzLnNjYWxlWSAqIGEpIC8gYSwgXyA9IHRoaXMudC5zdHlsZSwgcCA9IHRoaXMudC5jdXJyZW50U3R5bGU7XG4gICAgICAgICAgICBpZiAocCkge1xuICAgICAgICAgICAgICAgIGkgPSBsLCBsID0gLWgsIGggPSAtaSwgZSA9IHAuZmlsdGVyLCBfLmZpbHRlciA9IFwiXCI7XG4gICAgICAgICAgICAgICAgdmFyIGYsIGQsIG0gPSB0aGlzLnQub2Zmc2V0V2lkdGgsIGcgPSB0aGlzLnQub2Zmc2V0SGVpZ2h0LCB2ID0gXCJhYnNvbHV0ZVwiICE9PSBwLnBvc2l0aW9uLCB4ID0gXCJwcm9naWQ6RFhJbWFnZVRyYW5zZm9ybS5NaWNyb3NvZnQuTWF0cml4KE0xMT1cIiArIG8gKyBcIiwgTTEyPVwiICsgbCArIFwiLCBNMjE9XCIgKyBoICsgXCIsIE0yMj1cIiArIHUsIHcgPSBzLngsIGIgPSBzLnk7XG4gICAgICAgICAgICAgICAgaWYgKG51bGwgIT0gcy5veCAmJiAoZiA9IChzLm94cCA/IC4wMSAqIG0gKiBzLm94IDogcy5veCkgLSBtIC8gMiwgZCA9IChzLm95cCA/IC4wMSAqIGcgKiBzLm95IDogcy5veSkgLSBnIC8gMiwgdyArPSBmIC0gKGYgKiBvICsgZCAqIGwpLCBiICs9IGQgLSAoZiAqIGggKyBkICogdSkpLCB2ID8gKGYgPSBtIC8gMiwgZCA9IGcgLyAyLCB4ICs9IFwiLCBEeD1cIiArIChmIC0gKGYgKiBvICsgZCAqIGwpICsgdykgKyBcIiwgRHk9XCIgKyAoZCAtIChmICogaCArIGQgKiB1KSArIGIpICsgXCIpXCIpIDogeCArPSBcIiwgc2l6aW5nTWV0aG9kPSdhdXRvIGV4cGFuZCcpXCIsIF8uZmlsdGVyID0gLTEgIT09IGUuaW5kZXhPZihcIkRYSW1hZ2VUcmFuc2Zvcm0uTWljcm9zb2Z0Lk1hdHJpeChcIikgPyBlLnJlcGxhY2UoTywgeCkgOiB4ICsgXCIgXCIgKyBlLCAoMCA9PT0gdCB8fCAxID09PSB0KSAmJiAxID09PSBvICYmIDAgPT09IGwgJiYgMCA9PT0gaCAmJiAxID09PSB1ICYmICh2ICYmIC0xID09PSB4LmluZGV4T2YoXCJEeD0wLCBEeT0wXCIpIHx8IFQudGVzdChlKSAmJiAxMDAgIT09IHBhcnNlRmxvYXQoUmVnRXhwLiQxKSB8fCAtMSA9PT0gZS5pbmRleE9mKFwiZ3JhZGllbnQoXCIgJiYgZS5pbmRleE9mKFwiQWxwaGFcIikpICYmIF8ucmVtb3ZlQXR0cmlidXRlKFwiZmlsdGVyXCIpKSwgIXYpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIFAsIFMsIFIsIGsgPSA4ID4gYyA/IDEgOiAtMTtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChmID0gcy5pZU9mZnNldFggfHwgMCwgZCA9IHMuaWVPZmZzZXRZIHx8IDAsIHMuaWVPZmZzZXRYID0gTWF0aC5yb3VuZCgobSAtICgoMCA+IG8gPyAtbyA6IG8pICogbSArICgwID4gbCA/IC1sIDogbCkgKiBnKSkgLyAyICsgdyksIHMuaWVPZmZzZXRZID0gTWF0aC5yb3VuZCgoZyAtICgoMCA+IHUgPyAtdSA6IHUpICogZyArICgwID4gaCA/IC1oIDogaCkgKiBtKSkgLyAyICsgYiksIGNlID0gMDsgNCA+IGNlOyBjZSsrKVMgPSBKW2NlXSwgUCA9IHBbU10sIGkgPSAtMSAhPT0gUC5pbmRleE9mKFwicHhcIikgPyBwYXJzZUZsb2F0KFApIDogWih0aGlzLnQsIFMsIHBhcnNlRmxvYXQoUCksIFAucmVwbGFjZSh5LCBcIlwiKSkgfHwgMCwgUiA9IGkgIT09IHNbU10gPyAyID4gY2UgPyAtcy5pZU9mZnNldFggOiAtcy5pZU9mZnNldFkgOiAyID4gY2UgPyBmIC0gcy5pZU9mZnNldFggOiBkIC0gcy5pZU9mZnNldFksIF9bU10gPSAoc1tTXSA9IE1hdGgucm91bmQoaSAtIFIgKiAoMCA9PT0gY2UgfHwgMiA9PT0gY2UgPyAxIDogaykpKSArIFwicHhcIlxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgU2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgdCwgZSwgaSwgcywgciwgbiwgYSwgbywgbCwgaCwgdSwgXywgZiwgYywgZCwgbSwgZywgdiwgeSwgVCwgeCwgdywgYiwgUCwgUywgUiwgayA9IHRoaXMuZGF0YSwgQyA9IHRoaXMudC5zdHlsZSwgQSA9IGsucm90YXRpb24gKiBNLCBPID0gay5zY2FsZVgsIEQgPSBrLnNjYWxlWSwgTCA9IGsuc2NhbGVaLCBOID0gay5wZXJzcGVjdGl2ZTtcbiAgICAgICAgICAgIGlmIChwICYmIChQID0gQy50b3AgPyBcInRvcFwiIDogQy5ib3R0b20gPyBcImJvdHRvbVwiIDogcGFyc2VGbG9hdChRKHRoaXMudCwgXCJ0b3BcIiwgbnVsbCwgITEpKSA/IFwiYm90dG9tXCIgOiBcInRvcFwiLCBUID0gUSh0aGlzLnQsIFAsIG51bGwsICExKSwgUyA9IHBhcnNlRmxvYXQoVCkgfHwgMCwgUiA9IFQuc3Vic3RyKChTICsgXCJcIikubGVuZ3RoKSB8fCBcInB4XCIsIGsuX2ZmRml4ID0gIWsuX2ZmRml4LCBDW1BdID0gKGsuX2ZmRml4ID8gUyArIC4wNSA6IFMgLSAuMDUpICsgUiksIEEgfHwgay5za2V3WCl2ID0gTWF0aC5jb3MoQSksIHkgPSBNYXRoLnNpbihBKSwgdCA9IHYsIHIgPSB5LCBrLnNrZXdYICYmIChBIC09IGsuc2tld1ggKiBNLCB2ID0gTWF0aC5jb3MoQSksIHkgPSBNYXRoLnNpbihBKSksIGUgPSAteSwgbiA9IHY7IGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmICghKGsucm90YXRpb25ZIHx8IGsucm90YXRpb25YIHx8IDEgIT09IEwgfHwgTikpcmV0dXJuIENbeWVdID0gXCJ0cmFuc2xhdGUzZChcIiArIGsueCArIFwicHgsXCIgKyBrLnkgKyBcInB4LFwiICsgay56ICsgXCJweClcIiArICgxICE9PSBPIHx8IDEgIT09IEQgPyBcIiBzY2FsZShcIiArIE8gKyBcIixcIiArIEQgKyBcIilcIiA6IFwiXCIpLCB2b2lkIDA7XG4gICAgICAgICAgICAgICAgdCA9IG4gPSAxLCBlID0gciA9IDBcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHUgPSAxLCBpID0gcyA9IGEgPSBvID0gbCA9IGggPSBfID0gZiA9IGMgPSAwLCBkID0gTiA/IC0xIC8gTiA6IDAsIG0gPSBrLnpPcmlnaW4sIGcgPSAxZTUsIEEgPSBrLnJvdGF0aW9uWSAqIE0sIEEgJiYgKHYgPSBNYXRoLmNvcyhBKSwgeSA9IE1hdGguc2luKEEpLCBsID0gdSAqIC15LCBmID0gZCAqIC15LCBpID0gdCAqIHksIGEgPSByICogeSwgdSAqPSB2LCBkICo9IHYsIHQgKj0gdiwgciAqPSB2KSwgQSA9IGsucm90YXRpb25YICogTSwgQSAmJiAodiA9IE1hdGguY29zKEEpLCB5ID0gTWF0aC5zaW4oQSksIFQgPSBlICogdiArIGkgKiB5LCB4ID0gbiAqIHYgKyBhICogeSwgdyA9IGggKiB2ICsgdSAqIHksIGIgPSBjICogdiArIGQgKiB5LCBpID0gZSAqIC15ICsgaSAqIHYsIGEgPSBuICogLXkgKyBhICogdiwgdSA9IGggKiAteSArIHUgKiB2LCBkID0gYyAqIC15ICsgZCAqIHYsIGUgPSBULCBuID0geCwgaCA9IHcsIGMgPSBiKSwgMSAhPT0gTCAmJiAoaSAqPSBMLCBhICo9IEwsIHUgKj0gTCwgZCAqPSBMKSwgMSAhPT0gRCAmJiAoZSAqPSBELCBuICo9IEQsIGggKj0gRCwgYyAqPSBEKSwgMSAhPT0gTyAmJiAodCAqPSBPLCByICo9IE8sIGwgKj0gTywgZiAqPSBPKSwgbSAmJiAoXyAtPSBtLCBzID0gaSAqIF8sIG8gPSBhICogXywgXyA9IHUgKiBfICsgbSksIHMgPSAoVCA9IChzICs9IGsueCkgLSAocyB8PSAwKSkgPyAoMCB8IFQgKiBnICsgKDAgPiBUID8gLS41IDogLjUpKSAvIGcgKyBzIDogcywgbyA9IChUID0gKG8gKz0gay55KSAtIChvIHw9IDApKSA/ICgwIHwgVCAqIGcgKyAoMCA+IFQgPyAtLjUgOiAuNSkpIC8gZyArIG8gOiBvLCBfID0gKFQgPSAoXyArPSBrLnopIC0gKF8gfD0gMCkpID8gKDAgfCBUICogZyArICgwID4gVCA/IC0uNSA6IC41KSkgLyBnICsgXyA6IF8sIENbeWVdID0gXCJtYXRyaXgzZChcIiArIFsoMCB8IHQgKiBnKSAvIGcsICgwIHwgciAqIGcpIC8gZywgKDAgfCBsICogZykgLyBnLCAoMCB8IGYgKiBnKSAvIGcsICgwIHwgZSAqIGcpIC8gZywgKDAgfCBuICogZykgLyBnLCAoMCB8IGggKiBnKSAvIGcsICgwIHwgYyAqIGcpIC8gZywgKDAgfCBpICogZykgLyBnLCAoMCB8IGEgKiBnKSAvIGcsICgwIHwgdSAqIGcpIC8gZywgKDAgfCBkICogZykgLyBnLCBzLCBvLCBfLCBOID8gMSArIC1fIC8gTiA6IDFdLmpvaW4oXCIsXCIpICsgXCIpXCJcbiAgICAgICAgfSwgUmUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgdCwgZSwgaSwgcywgciwgbiwgYSwgbywgbCwgaCA9IHRoaXMuZGF0YSwgdSA9IHRoaXMudCwgXyA9IHUuc3R5bGU7XG4gICAgICAgICAgICBwICYmICh0ID0gXy50b3AgPyBcInRvcFwiIDogXy5ib3R0b20gPyBcImJvdHRvbVwiIDogcGFyc2VGbG9hdChRKHUsIFwidG9wXCIsIG51bGwsICExKSkgPyBcImJvdHRvbVwiIDogXCJ0b3BcIiwgZSA9IFEodSwgdCwgbnVsbCwgITEpLCBpID0gcGFyc2VGbG9hdChlKSB8fCAwLCBzID0gZS5zdWJzdHIoKGkgKyBcIlwiKS5sZW5ndGgpIHx8IFwicHhcIiwgaC5fZmZGaXggPSAhaC5fZmZGaXgsIF9bdF0gPSAoaC5fZmZGaXggPyBpICsgLjA1IDogaSAtIC4wNSkgKyBzKSwgaC5yb3RhdGlvbiB8fCBoLnNrZXdYID8gKHIgPSBoLnJvdGF0aW9uICogTSwgbiA9IHIgLSBoLnNrZXdYICogTSwgYSA9IDFlNSwgbyA9IGguc2NhbGVYICogYSwgbCA9IGguc2NhbGVZICogYSwgX1t5ZV0gPSBcIm1hdHJpeChcIiArICgwIHwgTWF0aC5jb3MocikgKiBvKSAvIGEgKyBcIixcIiArICgwIHwgTWF0aC5zaW4ocikgKiBvKSAvIGEgKyBcIixcIiArICgwIHwgTWF0aC5zaW4obikgKiAtbCkgLyBhICsgXCIsXCIgKyAoMCB8IE1hdGguY29zKG4pICogbCkgLyBhICsgXCIsXCIgKyBoLnggKyBcIixcIiArIGgueSArIFwiKVwiKSA6IF9beWVdID0gXCJtYXRyaXgoXCIgKyBoLnNjYWxlWCArIFwiLDAsMCxcIiArIGguc2NhbGVZICsgXCIsXCIgKyBoLnggKyBcIixcIiArIGgueSArIFwiKVwiXG4gICAgICAgIH07XG4gICAgICAgIG1lKFwidHJhbnNmb3JtLHNjYWxlLHNjYWxlWCxzY2FsZVksc2NhbGVaLHgseSx6LHJvdGF0aW9uLHJvdGF0aW9uWCxyb3RhdGlvblkscm90YXRpb25aLHNrZXdYLHNrZXdZLHNob3J0Um90YXRpb24sc2hvcnRSb3RhdGlvblgsc2hvcnRSb3RhdGlvblksc2hvcnRSb3RhdGlvblosdHJhbnNmb3JtT3JpZ2luLHRyYW5zZm9ybVBlcnNwZWN0aXZlLGRpcmVjdGlvbmFsUm90YXRpb24scGFyc2VUcmFuc2Zvcm0sZm9yY2UzRFwiLCB7cGFyc2VyOiBmdW5jdGlvbiAodCwgZSwgaSwgcywgbiwgYSwgbykge1xuICAgICAgICAgICAgaWYgKHMuX3RyYW5zZm9ybSlyZXR1cm4gbjtcbiAgICAgICAgICAgIHZhciBsLCBoLCB1LCBfLCBwLCBmLCBjLCBkID0gcy5fdHJhbnNmb3JtID0gYmUodCwgciwgITAsIG8ucGFyc2VUcmFuc2Zvcm0pLCBtID0gdC5zdHlsZSwgZyA9IDFlLTYsIHYgPSB2ZS5sZW5ndGgsIHkgPSBvLCBUID0ge307XG4gICAgICAgICAgICBpZiAoXCJzdHJpbmdcIiA9PSB0eXBlb2YgeS50cmFuc2Zvcm0gJiYgeWUpdSA9IG0uY3NzVGV4dCwgbVt5ZV0gPSB5LnRyYW5zZm9ybSwgbS5kaXNwbGF5ID0gXCJibG9ja1wiLCBsID0gYmUodCwgbnVsbCwgITEpLCBtLmNzc1RleHQgPSB1OyBlbHNlIGlmIChcIm9iamVjdFwiID09IHR5cGVvZiB5KSB7XG4gICAgICAgICAgICAgICAgaWYgKGwgPSB7c2NhbGVYOiBzZShudWxsICE9IHkuc2NhbGVYID8geS5zY2FsZVggOiB5LnNjYWxlLCBkLnNjYWxlWCksIHNjYWxlWTogc2UobnVsbCAhPSB5LnNjYWxlWSA/IHkuc2NhbGVZIDogeS5zY2FsZSwgZC5zY2FsZVkpLCBzY2FsZVo6IHNlKG51bGwgIT0geS5zY2FsZVogPyB5LnNjYWxlWiA6IHkuc2NhbGUsIGQuc2NhbGVaKSwgeDogc2UoeS54LCBkLngpLCB5OiBzZSh5LnksIGQueSksIHo6IHNlKHkueiwgZC56KSwgcGVyc3BlY3RpdmU6IHNlKHkudHJhbnNmb3JtUGVyc3BlY3RpdmUsIGQucGVyc3BlY3RpdmUpfSwgYyA9IHkuZGlyZWN0aW9uYWxSb3RhdGlvbiwgbnVsbCAhPSBjKWlmIChcIm9iamVjdFwiID09IHR5cGVvZiBjKWZvciAodSBpbiBjKXlbdV0gPSBjW3VdOyBlbHNlIHkucm90YXRpb24gPSBjO1xuICAgICAgICAgICAgICAgIGwucm90YXRpb24gPSByZShcInJvdGF0aW9uXCJpbiB5ID8geS5yb3RhdGlvbiA6IFwic2hvcnRSb3RhdGlvblwiaW4geSA/IHkuc2hvcnRSb3RhdGlvbiArIFwiX3Nob3J0XCIgOiBcInJvdGF0aW9uWlwiaW4geSA/IHkucm90YXRpb25aIDogZC5yb3RhdGlvbiwgZC5yb3RhdGlvbiwgXCJyb3RhdGlvblwiLCBUKSwgd2UgJiYgKGwucm90YXRpb25YID0gcmUoXCJyb3RhdGlvblhcImluIHkgPyB5LnJvdGF0aW9uWCA6IFwic2hvcnRSb3RhdGlvblhcImluIHkgPyB5LnNob3J0Um90YXRpb25YICsgXCJfc2hvcnRcIiA6IGQucm90YXRpb25YIHx8IDAsIGQucm90YXRpb25YLCBcInJvdGF0aW9uWFwiLCBUKSwgbC5yb3RhdGlvblkgPSByZShcInJvdGF0aW9uWVwiaW4geSA/IHkucm90YXRpb25ZIDogXCJzaG9ydFJvdGF0aW9uWVwiaW4geSA/IHkuc2hvcnRSb3RhdGlvblkgKyBcIl9zaG9ydFwiIDogZC5yb3RhdGlvblkgfHwgMCwgZC5yb3RhdGlvblksIFwicm90YXRpb25ZXCIsIFQpKSwgbC5za2V3WCA9IG51bGwgPT0geS5za2V3WCA/IGQuc2tld1ggOiByZSh5LnNrZXdYLCBkLnNrZXdYKSwgbC5za2V3WSA9IG51bGwgPT0geS5za2V3WSA/IGQuc2tld1kgOiByZSh5LnNrZXdZLCBkLnNrZXdZKSwgKGggPSBsLnNrZXdZIC0gZC5za2V3WSkgJiYgKGwuc2tld1ggKz0gaCwgbC5yb3RhdGlvbiArPSBoKVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZm9yIChudWxsICE9IHkuZm9yY2UzRCAmJiAoZC5mb3JjZTNEID0geS5mb3JjZTNELCBmID0gITApLCBwID0gZC5mb3JjZTNEIHx8IGQueiB8fCBkLnJvdGF0aW9uWCB8fCBkLnJvdGF0aW9uWSB8fCBsLnogfHwgbC5yb3RhdGlvblggfHwgbC5yb3RhdGlvblkgfHwgbC5wZXJzcGVjdGl2ZSwgcCB8fCBudWxsID09IHkuc2NhbGUgfHwgKGwuc2NhbGVaID0gMSk7IC0tdiA+IC0xOylpID0gdmVbdl0sIF8gPSBsW2ldIC0gZFtpXSwgKF8gPiBnIHx8IC1nID4gXyB8fCBudWxsICE9IE5baV0pICYmIChmID0gITAsIG4gPSBuZXcgcGUoZCwgaSwgZFtpXSwgXywgbiksIGkgaW4gVCAmJiAobi5lID0gVFtpXSksIG4ueHMwID0gMCwgbi5wbHVnaW4gPSBhLCBzLl9vdmVyd3JpdGVQcm9wcy5wdXNoKG4ubikpO1xuICAgICAgICAgICAgcmV0dXJuIF8gPSB5LnRyYW5zZm9ybU9yaWdpbiwgKF8gfHwgd2UgJiYgcCAmJiBkLnpPcmlnaW4pICYmICh5ZSA/IChmID0gITAsIGkgPSB4ZSwgXyA9IChfIHx8IFEodCwgaSwgciwgITEsIFwiNTAlIDUwJVwiKSkgKyBcIlwiLCBuID0gbmV3IHBlKG0sIGksIDAsIDAsIG4sIC0xLCBcInRyYW5zZm9ybU9yaWdpblwiKSwgbi5iID0gbVtpXSwgbi5wbHVnaW4gPSBhLCB3ZSA/ICh1ID0gZC56T3JpZ2luLCBfID0gXy5zcGxpdChcIiBcIiksIGQuek9yaWdpbiA9IChfLmxlbmd0aCA+IDIgJiYgKDAgPT09IHUgfHwgXCIwcHhcIiAhPT0gX1syXSkgPyBwYXJzZUZsb2F0KF9bMl0pIDogdSkgfHwgMCwgbi54czAgPSBuLmUgPSBtW2ldID0gX1swXSArIFwiIFwiICsgKF9bMV0gfHwgXCI1MCVcIikgKyBcIiAwcHhcIiwgbiA9IG5ldyBwZShkLCBcInpPcmlnaW5cIiwgMCwgMCwgbiwgLTEsIG4ubiksIG4uYiA9IHUsIG4ueHMwID0gbi5lID0gZC56T3JpZ2luKSA6IG4ueHMwID0gbi5lID0gbVtpXSA9IF8pIDogZWUoXyArIFwiXCIsIGQpKSwgZiAmJiAocy5fdHJhbnNmb3JtVHlwZSA9IHAgfHwgMyA9PT0gdGhpcy5fdHJhbnNmb3JtVHlwZSA/IDMgOiAyKSwgblxuICAgICAgICB9LCBwcmVmaXg6ICEwfSksIG1lKFwiYm94U2hhZG93XCIsIHtkZWZhdWx0VmFsdWU6IFwiMHB4IDBweCAwcHggMHB4ICM5OTlcIiwgcHJlZml4OiAhMCwgY29sb3I6ICEwLCBtdWx0aTogITAsIGtleXdvcmQ6IFwiaW5zZXRcIn0pLCBtZShcImJvcmRlclJhZGl1c1wiLCB7ZGVmYXVsdFZhbHVlOiBcIjBweFwiLCBwYXJzZXI6IGZ1bmN0aW9uICh0LCBlLCBpLCBuLCBhKSB7XG4gICAgICAgICAgICBlID0gdGhpcy5mb3JtYXQoZSk7XG4gICAgICAgICAgICB2YXIgbywgbCwgaCwgdSwgXywgcCwgZiwgYywgZCwgbSwgZywgdiwgeSwgVCwgeCwgdywgYiA9IFtcImJvcmRlclRvcExlZnRSYWRpdXNcIiwgXCJib3JkZXJUb3BSaWdodFJhZGl1c1wiLCBcImJvcmRlckJvdHRvbVJpZ2h0UmFkaXVzXCIsIFwiYm9yZGVyQm90dG9tTGVmdFJhZGl1c1wiXSwgUCA9IHQuc3R5bGU7XG4gICAgICAgICAgICBmb3IgKGQgPSBwYXJzZUZsb2F0KHQub2Zmc2V0V2lkdGgpLCBtID0gcGFyc2VGbG9hdCh0Lm9mZnNldEhlaWdodCksIG8gPSBlLnNwbGl0KFwiIFwiKSwgbCA9IDA7IGIubGVuZ3RoID4gbDsgbCsrKXRoaXMucC5pbmRleE9mKFwiYm9yZGVyXCIpICYmIChiW2xdID0gcShiW2xdKSksIF8gPSB1ID0gUSh0LCBiW2xdLCByLCAhMSwgXCIwcHhcIiksIC0xICE9PSBfLmluZGV4T2YoXCIgXCIpICYmICh1ID0gXy5zcGxpdChcIiBcIiksIF8gPSB1WzBdLCB1ID0gdVsxXSksIHAgPSBoID0gb1tsXSwgZiA9IHBhcnNlRmxvYXQoXyksIHYgPSBfLnN1YnN0cigoZiArIFwiXCIpLmxlbmd0aCksIHkgPSBcIj1cIiA9PT0gcC5jaGFyQXQoMSksIHkgPyAoYyA9IHBhcnNlSW50KHAuY2hhckF0KDApICsgXCIxXCIsIDEwKSwgcCA9IHAuc3Vic3RyKDIpLCBjICo9IHBhcnNlRmxvYXQocCksIGcgPSBwLnN1YnN0cigoYyArIFwiXCIpLmxlbmd0aCAtICgwID4gYyA/IDEgOiAwKSkgfHwgXCJcIikgOiAoYyA9IHBhcnNlRmxvYXQocCksIGcgPSBwLnN1YnN0cigoYyArIFwiXCIpLmxlbmd0aCkpLCBcIlwiID09PSBnICYmIChnID0gc1tpXSB8fCB2KSwgZyAhPT0gdiAmJiAoVCA9IFoodCwgXCJib3JkZXJMZWZ0XCIsIGYsIHYpLCB4ID0gWih0LCBcImJvcmRlclRvcFwiLCBmLCB2KSwgXCIlXCIgPT09IGcgPyAoXyA9IDEwMCAqIChUIC8gZCkgKyBcIiVcIiwgdSA9IDEwMCAqICh4IC8gbSkgKyBcIiVcIikgOiBcImVtXCIgPT09IGcgPyAodyA9IFoodCwgXCJib3JkZXJMZWZ0XCIsIDEsIFwiZW1cIiksIF8gPSBUIC8gdyArIFwiZW1cIiwgdSA9IHggLyB3ICsgXCJlbVwiKSA6IChfID0gVCArIFwicHhcIiwgdSA9IHggKyBcInB4XCIpLCB5ICYmIChwID0gcGFyc2VGbG9hdChfKSArIGMgKyBnLCBoID0gcGFyc2VGbG9hdCh1KSArIGMgKyBnKSksIGEgPSBmZShQLCBiW2xdLCBfICsgXCIgXCIgKyB1LCBwICsgXCIgXCIgKyBoLCAhMSwgXCIwcHhcIiwgYSk7XG4gICAgICAgICAgICByZXR1cm4gYVxuICAgICAgICB9LCBwcmVmaXg6ICEwLCBmb3JtYXR0ZXI6IGhlKFwiMHB4IDBweCAwcHggMHB4XCIsICExLCAhMCl9KSwgbWUoXCJiYWNrZ3JvdW5kUG9zaXRpb25cIiwge2RlZmF1bHRWYWx1ZTogXCIwIDBcIiwgcGFyc2VyOiBmdW5jdGlvbiAodCwgZSwgaSwgcywgbiwgYSkge1xuICAgICAgICAgICAgdmFyIG8sIGwsIGgsIHUsIF8sIHAsIGYgPSBcImJhY2tncm91bmQtcG9zaXRpb25cIiwgZCA9IHIgfHwgVyh0LCBudWxsKSwgbSA9IHRoaXMuZm9ybWF0KChkID8gYyA/IGQuZ2V0UHJvcGVydHlWYWx1ZShmICsgXCIteFwiKSArIFwiIFwiICsgZC5nZXRQcm9wZXJ0eVZhbHVlKGYgKyBcIi15XCIpIDogZC5nZXRQcm9wZXJ0eVZhbHVlKGYpIDogdC5jdXJyZW50U3R5bGUuYmFja2dyb3VuZFBvc2l0aW9uWCArIFwiIFwiICsgdC5jdXJyZW50U3R5bGUuYmFja2dyb3VuZFBvc2l0aW9uWSkgfHwgXCIwIDBcIiksIGcgPSB0aGlzLmZvcm1hdChlKTtcbiAgICAgICAgICAgIGlmICgtMSAhPT0gbS5pbmRleE9mKFwiJVwiKSAhPSAoLTEgIT09IGcuaW5kZXhPZihcIiVcIikpICYmIChwID0gUSh0LCBcImJhY2tncm91bmRJbWFnZVwiKS5yZXBsYWNlKFIsIFwiXCIpLCBwICYmIFwibm9uZVwiICE9PSBwKSkge1xuICAgICAgICAgICAgICAgIGZvciAobyA9IG0uc3BsaXQoXCIgXCIpLCBsID0gZy5zcGxpdChcIiBcIiksIEkuc2V0QXR0cmlidXRlKFwic3JjXCIsIHApLCBoID0gMjsgLS1oID4gLTE7KW0gPSBvW2hdLCB1ID0gLTEgIT09IG0uaW5kZXhPZihcIiVcIiksIHUgIT09ICgtMSAhPT0gbFtoXS5pbmRleE9mKFwiJVwiKSkgJiYgKF8gPSAwID09PSBoID8gdC5vZmZzZXRXaWR0aCAtIEkud2lkdGggOiB0Lm9mZnNldEhlaWdodCAtIEkuaGVpZ2h0LCBvW2hdID0gdSA/IHBhcnNlRmxvYXQobSkgLyAxMDAgKiBfICsgXCJweFwiIDogMTAwICogKHBhcnNlRmxvYXQobSkgLyBfKSArIFwiJVwiKTtcbiAgICAgICAgICAgICAgICBtID0gby5qb2luKFwiIFwiKVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRoaXMucGFyc2VDb21wbGV4KHQuc3R5bGUsIG0sIGcsIG4sIGEpXG4gICAgICAgIH0sIGZvcm1hdHRlcjogZWV9KSwgbWUoXCJiYWNrZ3JvdW5kU2l6ZVwiLCB7ZGVmYXVsdFZhbHVlOiBcIjAgMFwiLCBmb3JtYXR0ZXI6IGVlfSksIG1lKFwicGVyc3BlY3RpdmVcIiwge2RlZmF1bHRWYWx1ZTogXCIwcHhcIiwgcHJlZml4OiAhMH0pLCBtZShcInBlcnNwZWN0aXZlT3JpZ2luXCIsIHtkZWZhdWx0VmFsdWU6IFwiNTAlIDUwJVwiLCBwcmVmaXg6ICEwfSksIG1lKFwidHJhbnNmb3JtU3R5bGVcIiwge3ByZWZpeDogITB9KSwgbWUoXCJiYWNrZmFjZVZpc2liaWxpdHlcIiwge3ByZWZpeDogITB9KSwgbWUoXCJ1c2VyU2VsZWN0XCIsIHtwcmVmaXg6ICEwfSksIG1lKFwibWFyZ2luXCIsIHtwYXJzZXI6IHVlKFwibWFyZ2luVG9wLG1hcmdpblJpZ2h0LG1hcmdpbkJvdHRvbSxtYXJnaW5MZWZ0XCIpfSksIG1lKFwicGFkZGluZ1wiLCB7cGFyc2VyOiB1ZShcInBhZGRpbmdUb3AscGFkZGluZ1JpZ2h0LHBhZGRpbmdCb3R0b20scGFkZGluZ0xlZnRcIil9KSwgbWUoXCJjbGlwXCIsIHtkZWZhdWx0VmFsdWU6IFwicmVjdCgwcHgsMHB4LDBweCwwcHgpXCIsIHBhcnNlcjogZnVuY3Rpb24gKHQsIGUsIGksIHMsIG4sIGEpIHtcbiAgICAgICAgICAgIHZhciBvLCBsLCBoO1xuICAgICAgICAgICAgcmV0dXJuIDkgPiBjID8gKGwgPSB0LmN1cnJlbnRTdHlsZSwgaCA9IDggPiBjID8gXCIgXCIgOiBcIixcIiwgbyA9IFwicmVjdChcIiArIGwuY2xpcFRvcCArIGggKyBsLmNsaXBSaWdodCArIGggKyBsLmNsaXBCb3R0b20gKyBoICsgbC5jbGlwTGVmdCArIFwiKVwiLCBlID0gdGhpcy5mb3JtYXQoZSkuc3BsaXQoXCIsXCIpLmpvaW4oaCkpIDogKG8gPSB0aGlzLmZvcm1hdChRKHQsIHRoaXMucCwgciwgITEsIHRoaXMuZGZsdCkpLCBlID0gdGhpcy5mb3JtYXQoZSkpLCB0aGlzLnBhcnNlQ29tcGxleCh0LnN0eWxlLCBvLCBlLCBuLCBhKVxuICAgICAgICB9fSksIG1lKFwidGV4dFNoYWRvd1wiLCB7ZGVmYXVsdFZhbHVlOiBcIjBweCAwcHggMHB4ICM5OTlcIiwgY29sb3I6ICEwLCBtdWx0aTogITB9KSwgbWUoXCJhdXRvUm91bmQsc3RyaWN0VW5pdHNcIiwge3BhcnNlcjogZnVuY3Rpb24gKHQsIGUsIGksIHMsIHIpIHtcbiAgICAgICAgICAgIHJldHVybiByXG4gICAgICAgIH19KSwgbWUoXCJib3JkZXJcIiwge2RlZmF1bHRWYWx1ZTogXCIwcHggc29saWQgIzAwMFwiLCBwYXJzZXI6IGZ1bmN0aW9uICh0LCBlLCBpLCBzLCBuLCBhKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5wYXJzZUNvbXBsZXgodC5zdHlsZSwgdGhpcy5mb3JtYXQoUSh0LCBcImJvcmRlclRvcFdpZHRoXCIsIHIsICExLCBcIjBweFwiKSArIFwiIFwiICsgUSh0LCBcImJvcmRlclRvcFN0eWxlXCIsIHIsICExLCBcInNvbGlkXCIpICsgXCIgXCIgKyBRKHQsIFwiYm9yZGVyVG9wQ29sb3JcIiwgciwgITEsIFwiIzAwMFwiKSksIHRoaXMuZm9ybWF0KGUpLCBuLCBhKVxuICAgICAgICB9LCBjb2xvcjogITAsIGZvcm1hdHRlcjogZnVuY3Rpb24gKHQpIHtcbiAgICAgICAgICAgIHZhciBlID0gdC5zcGxpdChcIiBcIik7XG4gICAgICAgICAgICByZXR1cm4gZVswXSArIFwiIFwiICsgKGVbMV0gfHwgXCJzb2xpZFwiKSArIFwiIFwiICsgKHQubWF0Y2gobGUpIHx8IFtcIiMwMDBcIl0pWzBdXG4gICAgICAgIH19KSwgbWUoXCJmbG9hdCxjc3NGbG9hdCxzdHlsZUZsb2F0XCIsIHtwYXJzZXI6IGZ1bmN0aW9uICh0LCBlLCBpLCBzLCByKSB7XG4gICAgICAgICAgICB2YXIgbiA9IHQuc3R5bGUsIGEgPSBcImNzc0Zsb2F0XCJpbiBuID8gXCJjc3NGbG9hdFwiIDogXCJzdHlsZUZsb2F0XCI7XG4gICAgICAgICAgICByZXR1cm4gbmV3IHBlKG4sIGEsIDAsIDAsIHIsIC0xLCBpLCAhMSwgMCwgblthXSwgZSlcbiAgICAgICAgfX0pO1xuICAgICAgICB2YXIga2UgPSBmdW5jdGlvbiAodCkge1xuICAgICAgICAgICAgdmFyIGUsIGkgPSB0aGlzLnQsIHMgPSBpLmZpbHRlciB8fCBRKHRoaXMuZGF0YSwgXCJmaWx0ZXJcIiksIHIgPSAwIHwgdGhpcy5zICsgdGhpcy5jICogdDtcbiAgICAgICAgICAgIDEwMCA9PT0gciAmJiAoLTEgPT09IHMuaW5kZXhPZihcImF0cml4KFwiKSAmJiAtMSA9PT0gcy5pbmRleE9mKFwicmFkaWVudChcIikgJiYgLTEgPT09IHMuaW5kZXhPZihcIm9hZGVyKFwiKSA/IChpLnJlbW92ZUF0dHJpYnV0ZShcImZpbHRlclwiKSwgZSA9ICFRKHRoaXMuZGF0YSwgXCJmaWx0ZXJcIikpIDogKGkuZmlsdGVyID0gcy5yZXBsYWNlKHcsIFwiXCIpLCBlID0gITApKSwgZSB8fCAodGhpcy54bjEgJiYgKGkuZmlsdGVyID0gcyA9IHMgfHwgXCJhbHBoYShvcGFjaXR5PVwiICsgciArIFwiKVwiKSwgLTEgPT09IHMuaW5kZXhPZihcIm9wYWNpdHlcIikgPyAwID09PSByICYmIHRoaXMueG4xIHx8IChpLmZpbHRlciA9IHMgKyBcIiBhbHBoYShvcGFjaXR5PVwiICsgciArIFwiKVwiKSA6IGkuZmlsdGVyID0gcy5yZXBsYWNlKFQsIFwib3BhY2l0eT1cIiArIHIpKVxuICAgICAgICB9O1xuICAgICAgICBtZShcIm9wYWNpdHksYWxwaGEsYXV0b0FscGhhXCIsIHtkZWZhdWx0VmFsdWU6IFwiMVwiLCBwYXJzZXI6IGZ1bmN0aW9uICh0LCBlLCBpLCBzLCBuLCBhKSB7XG4gICAgICAgICAgICB2YXIgbyA9IHBhcnNlRmxvYXQoUSh0LCBcIm9wYWNpdHlcIiwgciwgITEsIFwiMVwiKSksIGwgPSB0LnN0eWxlLCBoID0gXCJhdXRvQWxwaGFcIiA9PT0gaTtcbiAgICAgICAgICAgIHJldHVyblwic3RyaW5nXCIgPT0gdHlwZW9mIGUgJiYgXCI9XCIgPT09IGUuY2hhckF0KDEpICYmIChlID0gKFwiLVwiID09PSBlLmNoYXJBdCgwKSA/IC0xIDogMSkgKiBwYXJzZUZsb2F0KGUuc3Vic3RyKDIpKSArIG8pLCBoICYmIDEgPT09IG8gJiYgXCJoaWRkZW5cIiA9PT0gUSh0LCBcInZpc2liaWxpdHlcIiwgcikgJiYgMCAhPT0gZSAmJiAobyA9IDApLCB6ID8gbiA9IG5ldyBwZShsLCBcIm9wYWNpdHlcIiwgbywgZSAtIG8sIG4pIDogKG4gPSBuZXcgcGUobCwgXCJvcGFjaXR5XCIsIDEwMCAqIG8sIDEwMCAqIChlIC0gbyksIG4pLCBuLnhuMSA9IGggPyAxIDogMCwgbC56b29tID0gMSwgbi50eXBlID0gMiwgbi5iID0gXCJhbHBoYShvcGFjaXR5PVwiICsgbi5zICsgXCIpXCIsIG4uZSA9IFwiYWxwaGEob3BhY2l0eT1cIiArIChuLnMgKyBuLmMpICsgXCIpXCIsIG4uZGF0YSA9IHQsIG4ucGx1Z2luID0gYSwgbi5zZXRSYXRpbyA9IGtlKSwgaCAmJiAobiA9IG5ldyBwZShsLCBcInZpc2liaWxpdHlcIiwgMCwgMCwgbiwgLTEsIG51bGwsICExLCAwLCAwICE9PSBvID8gXCJpbmhlcml0XCIgOiBcImhpZGRlblwiLCAwID09PSBlID8gXCJoaWRkZW5cIiA6IFwiaW5oZXJpdFwiKSwgbi54czAgPSBcImluaGVyaXRcIiwgcy5fb3ZlcndyaXRlUHJvcHMucHVzaChuLm4pLCBzLl9vdmVyd3JpdGVQcm9wcy5wdXNoKGkpKSwgblxuICAgICAgICB9fSk7XG4gICAgICAgIHZhciBDZSA9IGZ1bmN0aW9uICh0LCBlKSB7XG4gICAgICAgICAgICBlICYmICh0LnJlbW92ZVByb3BlcnR5ID8gdC5yZW1vdmVQcm9wZXJ0eShlLnJlcGxhY2UoUCwgXCItJDFcIikudG9Mb3dlckNhc2UoKSkgOiB0LnJlbW92ZUF0dHJpYnV0ZShlKSlcbiAgICAgICAgfSwgQWUgPSBmdW5jdGlvbiAodCkge1xuICAgICAgICAgICAgaWYgKHRoaXMudC5fZ3NDbGFzc1BUID0gdGhpcywgMSA9PT0gdCB8fCAwID09PSB0KSB7XG4gICAgICAgICAgICAgICAgdGhpcy50LmNsYXNzTmFtZSA9IDAgPT09IHQgPyB0aGlzLmIgOiB0aGlzLmU7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgZSA9IHRoaXMuZGF0YSwgaSA9IHRoaXMudC5zdHlsZTsgZTspZS52ID8gaVtlLnBdID0gZS52IDogQ2UoaSwgZS5wKSwgZSA9IGUuX25leHQ7XG4gICAgICAgICAgICAgICAgMSA9PT0gdCAmJiB0aGlzLnQuX2dzQ2xhc3NQVCA9PT0gdGhpcyAmJiAodGhpcy50Ll9nc0NsYXNzUFQgPSBudWxsKVxuICAgICAgICAgICAgfSBlbHNlIHRoaXMudC5jbGFzc05hbWUgIT09IHRoaXMuZSAmJiAodGhpcy50LmNsYXNzTmFtZSA9IHRoaXMuZSlcbiAgICAgICAgfTtcbiAgICAgICAgbWUoXCJjbGFzc05hbWVcIiwge3BhcnNlcjogZnVuY3Rpb24gKHQsIGUsIHMsIG4sIGEsIG8sIGwpIHtcbiAgICAgICAgICAgIHZhciBoLCB1LCBfLCBwLCBmLCBjID0gdC5jbGFzc05hbWUsIGQgPSB0LnN0eWxlLmNzc1RleHQ7XG4gICAgICAgICAgICBpZiAoYSA9IG4uX2NsYXNzTmFtZVBUID0gbmV3IHBlKHQsIHMsIDAsIDAsIGEsIDIpLCBhLnNldFJhdGlvID0gQWUsIGEucHIgPSAtMTEsIGkgPSAhMCwgYS5iID0gYywgdSA9ICQodCwgciksIF8gPSB0Ll9nc0NsYXNzUFQpIHtcbiAgICAgICAgICAgICAgICBmb3IgKHAgPSB7fSwgZiA9IF8uZGF0YTsgZjspcFtmLnBdID0gMSwgZiA9IGYuX25leHQ7XG4gICAgICAgICAgICAgICAgXy5zZXRSYXRpbygxKVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHQuX2dzQ2xhc3NQVCA9IGEsIGEuZSA9IFwiPVwiICE9PSBlLmNoYXJBdCgxKSA/IGUgOiBjLnJlcGxhY2UoUmVnRXhwKFwiXFxcXHMqXFxcXGJcIiArIGUuc3Vic3RyKDIpICsgXCJcXFxcYlwiKSwgXCJcIikgKyAoXCIrXCIgPT09IGUuY2hhckF0KDApID8gXCIgXCIgKyBlLnN1YnN0cigyKSA6IFwiXCIpLCBuLl90d2Vlbi5fZHVyYXRpb24gJiYgKHQuY2xhc3NOYW1lID0gYS5lLCBoID0gRyh0LCB1LCAkKHQpLCBsLCBwKSwgdC5jbGFzc05hbWUgPSBjLCBhLmRhdGEgPSBoLmZpcnN0TVBULCB0LnN0eWxlLmNzc1RleHQgPSBkLCBhID0gYS54Zmlyc3QgPSBuLnBhcnNlKHQsIGguZGlmcywgYSwgbykpLCBhXG4gICAgICAgIH19KTtcbiAgICAgICAgdmFyIE9lID0gZnVuY3Rpb24gKHQpIHtcbiAgICAgICAgICAgIGlmICgoMSA9PT0gdCB8fCAwID09PSB0KSAmJiB0aGlzLmRhdGEuX3RvdGFsVGltZSA9PT0gdGhpcy5kYXRhLl90b3RhbER1cmF0aW9uICYmIFwiaXNGcm9tU3RhcnRcIiAhPT0gdGhpcy5kYXRhLmRhdGEpIHtcbiAgICAgICAgICAgICAgICB2YXIgZSwgaSwgcywgciwgbiA9IHRoaXMudC5zdHlsZSwgYSA9IG8udHJhbnNmb3JtLnBhcnNlO1xuICAgICAgICAgICAgICAgIGlmIChcImFsbFwiID09PSB0aGlzLmUpbi5jc3NUZXh0ID0gXCJcIiwgciA9ICEwOyBlbHNlIGZvciAoZSA9IHRoaXMuZS5zcGxpdChcIixcIiksIHMgPSBlLmxlbmd0aDsgLS1zID4gLTE7KWkgPSBlW3NdLCBvW2ldICYmIChvW2ldLnBhcnNlID09PSBhID8gciA9ICEwIDogaSA9IFwidHJhbnNmb3JtT3JpZ2luXCIgPT09IGkgPyB4ZSA6IG9baV0ucCksIENlKG4sIGkpO1xuICAgICAgICAgICAgICAgIHIgJiYgKENlKG4sIHllKSwgdGhpcy50Ll9nc1RyYW5zZm9ybSAmJiBkZWxldGUgdGhpcy50Ll9nc1RyYW5zZm9ybSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgZm9yIChtZShcImNsZWFyUHJvcHNcIiwge3BhcnNlcjogZnVuY3Rpb24gKHQsIGUsIHMsIHIsIG4pIHtcbiAgICAgICAgICAgIHJldHVybiBuID0gbmV3IHBlKHQsIHMsIDAsIDAsIG4sIDIpLCBuLnNldFJhdGlvID0gT2UsIG4uZSA9IGUsIG4ucHIgPSAtMTAsIG4uZGF0YSA9IHIuX3R3ZWVuLCBpID0gITAsIG5cbiAgICAgICAgfX0pLCBsID0gXCJiZXppZXIsdGhyb3dQcm9wcyxwaHlzaWNzUHJvcHMscGh5c2ljczJEXCIuc3BsaXQoXCIsXCIpLCBjZSA9IGwubGVuZ3RoOyBjZS0tOylnZShsW2NlXSk7XG4gICAgICAgIGwgPSBhLnByb3RvdHlwZSwgbC5fZmlyc3RQVCA9IG51bGwsIGwuX29uSW5pdFR3ZWVuID0gZnVuY3Rpb24gKHQsIGUsIG8pIHtcbiAgICAgICAgICAgIGlmICghdC5ub2RlVHlwZSlyZXR1cm4hMTtcbiAgICAgICAgICAgIHRoaXMuX3RhcmdldCA9IHQsIHRoaXMuX3R3ZWVuID0gbywgdGhpcy5fdmFycyA9IGUsIGggPSBlLmF1dG9Sb3VuZCwgaSA9ICExLCBzID0gZS5zdWZmaXhNYXAgfHwgYS5zdWZmaXhNYXAsIHIgPSBXKHQsIFwiXCIpLCBuID0gdGhpcy5fb3ZlcndyaXRlUHJvcHM7XG4gICAgICAgICAgICB2YXIgbCwgcCwgYywgZCwgbSwgZywgdiwgeSwgVCwgdyA9IHQuc3R5bGU7XG4gICAgICAgICAgICBpZiAodSAmJiBcIlwiID09PSB3LnpJbmRleCAmJiAobCA9IFEodCwgXCJ6SW5kZXhcIiwgciksIChcImF1dG9cIiA9PT0gbCB8fCBcIlwiID09PSBsKSAmJiAody56SW5kZXggPSAwKSksIFwic3RyaW5nXCIgPT0gdHlwZW9mIGUgJiYgKGQgPSB3LmNzc1RleHQsIGwgPSAkKHQsIHIpLCB3LmNzc1RleHQgPSBkICsgXCI7XCIgKyBlLCBsID0gRyh0LCBsLCAkKHQpKS5kaWZzLCAheiAmJiB4LnRlc3QoZSkgJiYgKGwub3BhY2l0eSA9IHBhcnNlRmxvYXQoUmVnRXhwLiQxKSksIGUgPSBsLCB3LmNzc1RleHQgPSBkKSwgdGhpcy5fZmlyc3RQVCA9IHAgPSB0aGlzLnBhcnNlKHQsIGUsIG51bGwpLCB0aGlzLl90cmFuc2Zvcm1UeXBlKSB7XG4gICAgICAgICAgICAgICAgZm9yIChUID0gMyA9PT0gdGhpcy5fdHJhbnNmb3JtVHlwZSwgeWUgPyBfICYmICh1ID0gITAsIFwiXCIgPT09IHcuekluZGV4ICYmICh2ID0gUSh0LCBcInpJbmRleFwiLCByKSwgKFwiYXV0b1wiID09PSB2IHx8IFwiXCIgPT09IHYpICYmICh3LnpJbmRleCA9IDApKSwgZiAmJiAody5XZWJraXRCYWNrZmFjZVZpc2liaWxpdHkgPSB0aGlzLl92YXJzLldlYmtpdEJhY2tmYWNlVmlzaWJpbGl0eSB8fCAoVCA/IFwidmlzaWJsZVwiIDogXCJoaWRkZW5cIikpKSA6IHcuem9vbSA9IDEsIGMgPSBwOyBjICYmIGMuX25leHQ7KWMgPSBjLl9uZXh0O1xuICAgICAgICAgICAgICAgIHkgPSBuZXcgcGUodCwgXCJ0cmFuc2Zvcm1cIiwgMCwgMCwgbnVsbCwgMiksIHRoaXMuX2xpbmtDU1NQKHksIG51bGwsIGMpLCB5LnNldFJhdGlvID0gVCAmJiB3ZSA/IFNlIDogeWUgPyBSZSA6IFBlLCB5LmRhdGEgPSB0aGlzLl90cmFuc2Zvcm0gfHwgYmUodCwgciwgITApLCBuLnBvcCgpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoaSkge1xuICAgICAgICAgICAgICAgIGZvciAoOyBwOykge1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGcgPSBwLl9uZXh0LCBjID0gZDsgYyAmJiBjLnByID4gcC5wcjspYyA9IGMuX25leHQ7XG4gICAgICAgICAgICAgICAgICAgIChwLl9wcmV2ID0gYyA/IGMuX3ByZXYgOiBtKSA/IHAuX3ByZXYuX25leHQgPSBwIDogZCA9IHAsIChwLl9uZXh0ID0gYykgPyBjLl9wcmV2ID0gcCA6IG0gPSBwLCBwID0gZ1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLl9maXJzdFBUID0gZFxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuITBcbiAgICAgICAgfSwgbC5wYXJzZSA9IGZ1bmN0aW9uICh0LCBlLCBpLCBuKSB7XG4gICAgICAgICAgICB2YXIgYSwgbCwgdSwgXywgcCwgZiwgYywgZCwgbSwgZywgdiA9IHQuc3R5bGU7XG4gICAgICAgICAgICBmb3IgKGEgaW4gZSlmID0gZVthXSwgbCA9IG9bYV0sIGwgPyBpID0gbC5wYXJzZSh0LCBmLCBhLCB0aGlzLCBpLCBuLCBlKSA6IChwID0gUSh0LCBhLCByKSArIFwiXCIsIG0gPSBcInN0cmluZ1wiID09IHR5cGVvZiBmLCBcImNvbG9yXCIgPT09IGEgfHwgXCJmaWxsXCIgPT09IGEgfHwgXCJzdHJva2VcIiA9PT0gYSB8fCAtMSAhPT0gYS5pbmRleE9mKFwiQ29sb3JcIikgfHwgbSAmJiBiLnRlc3QoZikgPyAobSB8fCAoZiA9IG9lKGYpLCBmID0gKGYubGVuZ3RoID4gMyA/IFwicmdiYShcIiA6IFwicmdiKFwiKSArIGYuam9pbihcIixcIikgKyBcIilcIiksIGkgPSBmZSh2LCBhLCBwLCBmLCAhMCwgXCJ0cmFuc3BhcmVudFwiLCBpLCAwLCBuKSkgOiAhbSB8fCAtMSA9PT0gZi5pbmRleE9mKFwiIFwiKSAmJiAtMSA9PT0gZi5pbmRleE9mKFwiLFwiKSA/ICh1ID0gcGFyc2VGbG9hdChwKSwgYyA9IHUgfHwgMCA9PT0gdSA/IHAuc3Vic3RyKCh1ICsgXCJcIikubGVuZ3RoKSA6IFwiXCIsIChcIlwiID09PSBwIHx8IFwiYXV0b1wiID09PSBwKSAmJiAoXCJ3aWR0aFwiID09PSBhIHx8IFwiaGVpZ2h0XCIgPT09IGEgPyAodSA9IHRlKHQsIGEsIHIpLCBjID0gXCJweFwiKSA6IFwibGVmdFwiID09PSBhIHx8IFwidG9wXCIgPT09IGEgPyAodSA9IEgodCwgYSwgciksIGMgPSBcInB4XCIpIDogKHUgPSBcIm9wYWNpdHlcIiAhPT0gYSA/IDAgOiAxLCBjID0gXCJcIikpLCBnID0gbSAmJiBcIj1cIiA9PT0gZi5jaGFyQXQoMSksIGcgPyAoXyA9IHBhcnNlSW50KGYuY2hhckF0KDApICsgXCIxXCIsIDEwKSwgZiA9IGYuc3Vic3RyKDIpLCBfICo9IHBhcnNlRmxvYXQoZiksIGQgPSBmLnJlcGxhY2UoeSwgXCJcIikpIDogKF8gPSBwYXJzZUZsb2F0KGYpLCBkID0gbSA/IGYuc3Vic3RyKChfICsgXCJcIikubGVuZ3RoKSB8fCBcIlwiIDogXCJcIiksIFwiXCIgPT09IGQgJiYgKGQgPSBzW2FdIHx8IGMpLCBmID0gXyB8fCAwID09PSBfID8gKGcgPyBfICsgdSA6IF8pICsgZCA6IGVbYV0sIGMgIT09IGQgJiYgXCJcIiAhPT0gZCAmJiAoXyB8fCAwID09PSBfKSAmJiAodSB8fCAwID09PSB1KSAmJiAodSA9IFoodCwgYSwgdSwgYyksIFwiJVwiID09PSBkID8gKHUgLz0gWih0LCBhLCAxMDAsIFwiJVwiKSAvIDEwMCwgdSA+IDEwMCAmJiAodSA9IDEwMCksIGUuc3RyaWN0VW5pdHMgIT09ICEwICYmIChwID0gdSArIFwiJVwiKSkgOiBcImVtXCIgPT09IGQgPyB1IC89IFoodCwgYSwgMSwgXCJlbVwiKSA6IChfID0gWih0LCBhLCBfLCBkKSwgZCA9IFwicHhcIiksIGcgJiYgKF8gfHwgMCA9PT0gXykgJiYgKGYgPSBfICsgdSArIGQpKSwgZyAmJiAoXyArPSB1KSwgIXUgJiYgMCAhPT0gdSB8fCAhXyAmJiAwICE9PSBfID8gdm9pZCAwICE9PSB2W2FdICYmIChmIHx8IFwiTmFOXCIgIT0gZiArIFwiXCIgJiYgbnVsbCAhPSBmKSA/IChpID0gbmV3IHBlKHYsIGEsIF8gfHwgdSB8fCAwLCAwLCBpLCAtMSwgYSwgITEsIDAsIHAsIGYpLCBpLnhzMCA9IFwibm9uZVwiICE9PSBmIHx8IFwiZGlzcGxheVwiICE9PSBhICYmIC0xID09PSBhLmluZGV4T2YoXCJTdHlsZVwiKSA/IGYgOiBwKSA6IEIoXCJpbnZhbGlkIFwiICsgYSArIFwiIHR3ZWVuIHZhbHVlOiBcIiArIGVbYV0pIDogKGkgPSBuZXcgcGUodiwgYSwgdSwgXyAtIHUsIGksIDAsIGEsIGggIT09ICExICYmIChcInB4XCIgPT09IGQgfHwgXCJ6SW5kZXhcIiA9PT0gYSksIDAsIHAsIGYpLCBpLnhzMCA9IGQpKSA6IGkgPSBmZSh2LCBhLCBwLCBmLCAhMCwgbnVsbCwgaSwgMCwgbikpLCBuICYmIGkgJiYgIWkucGx1Z2luICYmIChpLnBsdWdpbiA9IG4pO1xuICAgICAgICAgICAgcmV0dXJuIGlcbiAgICAgICAgfSwgbC5zZXRSYXRpbyA9IGZ1bmN0aW9uICh0KSB7XG4gICAgICAgICAgICB2YXIgZSwgaSwgcywgciA9IHRoaXMuX2ZpcnN0UFQsIG4gPSAxZS02O1xuICAgICAgICAgICAgaWYgKDEgIT09IHQgfHwgdGhpcy5fdHdlZW4uX3RpbWUgIT09IHRoaXMuX3R3ZWVuLl9kdXJhdGlvbiAmJiAwICE9PSB0aGlzLl90d2Vlbi5fdGltZSlpZiAodCB8fCB0aGlzLl90d2Vlbi5fdGltZSAhPT0gdGhpcy5fdHdlZW4uX2R1cmF0aW9uICYmIDAgIT09IHRoaXMuX3R3ZWVuLl90aW1lIHx8IHRoaXMuX3R3ZWVuLl9yYXdQcmV2VGltZSA9PT0gLTFlLTYpZm9yICg7IHI7KSB7XG4gICAgICAgICAgICAgICAgaWYgKGUgPSByLmMgKiB0ICsgci5zLCByLnIgPyBlID0gZSA+IDAgPyAwIHwgZSArIC41IDogMCB8IGUgLSAuNSA6IG4gPiBlICYmIGUgPiAtbiAmJiAoZSA9IDApLCByLnR5cGUpaWYgKDEgPT09IHIudHlwZSlpZiAocyA9IHIubCwgMiA9PT0gcylyLnRbci5wXSA9IHIueHMwICsgZSArIHIueHMxICsgci54bjEgKyByLnhzMjsgZWxzZSBpZiAoMyA9PT0gcylyLnRbci5wXSA9IHIueHMwICsgZSArIHIueHMxICsgci54bjEgKyByLnhzMiArIHIueG4yICsgci54czM7IGVsc2UgaWYgKDQgPT09IHMpci50W3IucF0gPSByLnhzMCArIGUgKyByLnhzMSArIHIueG4xICsgci54czIgKyByLnhuMiArIHIueHMzICsgci54bjMgKyByLnhzNDsgZWxzZSBpZiAoNSA9PT0gcylyLnRbci5wXSA9IHIueHMwICsgZSArIHIueHMxICsgci54bjEgKyByLnhzMiArIHIueG4yICsgci54czMgKyByLnhuMyArIHIueHM0ICsgci54bjQgKyByLnhzNTsgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGZvciAoaSA9IHIueHMwICsgZSArIHIueHMxLCBzID0gMTsgci5sID4gczsgcysrKWkgKz0gcltcInhuXCIgKyBzXSArIHJbXCJ4c1wiICsgKHMgKyAxKV07XG4gICAgICAgICAgICAgICAgICAgIHIudFtyLnBdID0gaVxuICAgICAgICAgICAgICAgIH0gZWxzZS0xID09PSByLnR5cGUgPyByLnRbci5wXSA9IHIueHMwIDogci5zZXRSYXRpbyAmJiByLnNldFJhdGlvKHQpOyBlbHNlIHIudFtyLnBdID0gZSArIHIueHMwO1xuICAgICAgICAgICAgICAgIHIgPSByLl9uZXh0XG4gICAgICAgICAgICB9IGVsc2UgZm9yICg7IHI7KTIgIT09IHIudHlwZSA/IHIudFtyLnBdID0gci5iIDogci5zZXRSYXRpbyh0KSwgciA9IHIuX25leHQ7IGVsc2UgZm9yICg7IHI7KTIgIT09IHIudHlwZSA/IHIudFtyLnBdID0gci5lIDogci5zZXRSYXRpbyh0KSwgciA9IHIuX25leHRcbiAgICAgICAgfSwgbC5fZW5hYmxlVHJhbnNmb3JtcyA9IGZ1bmN0aW9uICh0KSB7XG4gICAgICAgICAgICB0aGlzLl90cmFuc2Zvcm1UeXBlID0gdCB8fCAzID09PSB0aGlzLl90cmFuc2Zvcm1UeXBlID8gMyA6IDIsIHRoaXMuX3RyYW5zZm9ybSA9IHRoaXMuX3RyYW5zZm9ybSB8fCBiZSh0aGlzLl90YXJnZXQsIHIsICEwKVxuICAgICAgICB9LCBsLl9saW5rQ1NTUCA9IGZ1bmN0aW9uICh0LCBlLCBpLCBzKSB7XG4gICAgICAgICAgICByZXR1cm4gdCAmJiAoZSAmJiAoZS5fcHJldiA9IHQpLCB0Ll9uZXh0ICYmICh0Ll9uZXh0Ll9wcmV2ID0gdC5fcHJldiksIHQuX3ByZXYgPyB0Ll9wcmV2Ll9uZXh0ID0gdC5fbmV4dCA6IHRoaXMuX2ZpcnN0UFQgPT09IHQgJiYgKHRoaXMuX2ZpcnN0UFQgPSB0Ll9uZXh0LCBzID0gITApLCBpID8gaS5fbmV4dCA9IHQgOiBzIHx8IG51bGwgIT09IHRoaXMuX2ZpcnN0UFQgfHwgKHRoaXMuX2ZpcnN0UFQgPSB0KSwgdC5fbmV4dCA9IGUsIHQuX3ByZXYgPSBpKSwgdFxuICAgICAgICB9LCBsLl9raWxsID0gZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgIHZhciBpLCBzLCByLCBuID0gZTtcbiAgICAgICAgICAgIGlmIChlLmF1dG9BbHBoYSB8fCBlLmFscGhhKSB7XG4gICAgICAgICAgICAgICAgbiA9IHt9O1xuICAgICAgICAgICAgICAgIGZvciAocyBpbiBlKW5bc10gPSBlW3NdO1xuICAgICAgICAgICAgICAgIG4ub3BhY2l0eSA9IDEsIG4uYXV0b0FscGhhICYmIChuLnZpc2liaWxpdHkgPSAxKVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGUuY2xhc3NOYW1lICYmIChpID0gdGhpcy5fY2xhc3NOYW1lUFQpICYmIChyID0gaS54Zmlyc3QsIHIgJiYgci5fcHJldiA/IHRoaXMuX2xpbmtDU1NQKHIuX3ByZXYsIGkuX25leHQsIHIuX3ByZXYuX3ByZXYpIDogciA9PT0gdGhpcy5fZmlyc3RQVCAmJiAodGhpcy5fZmlyc3RQVCA9IGkuX25leHQpLCBpLl9uZXh0ICYmIHRoaXMuX2xpbmtDU1NQKGkuX25leHQsIGkuX25leHQuX25leHQsIHIuX3ByZXYpLCB0aGlzLl9jbGFzc05hbWVQVCA9IG51bGwpLCB0LnByb3RvdHlwZS5fa2lsbC5jYWxsKHRoaXMsIG4pXG4gICAgICAgIH07XG4gICAgICAgIHZhciBEZSA9IGZ1bmN0aW9uICh0LCBlLCBpKSB7XG4gICAgICAgICAgICB2YXIgcywgciwgbiwgYTtcbiAgICAgICAgICAgIGlmICh0LnNsaWNlKWZvciAociA9IHQubGVuZ3RoOyAtLXIgPiAtMTspRGUodFtyXSwgZSwgaSk7IGVsc2UgZm9yIChzID0gdC5jaGlsZE5vZGVzLCByID0gcy5sZW5ndGg7IC0tciA+IC0xOyluID0gc1tyXSwgYSA9IG4udHlwZSwgbi5zdHlsZSAmJiAoZS5wdXNoKCQobikpLCBpICYmIGkucHVzaChuKSksIDEgIT09IGEgJiYgOSAhPT0gYSAmJiAxMSAhPT0gYSB8fCAhbi5jaGlsZE5vZGVzLmxlbmd0aCB8fCBEZShuLCBlLCBpKVxuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gYS5jYXNjYWRlVG8gPSBmdW5jdGlvbiAodCwgaSwgcykge1xuICAgICAgICAgICAgdmFyIHIsIG4sIGEsIG8gPSBlLnRvKHQsIGksIHMpLCBsID0gW29dLCBoID0gW10sIHUgPSBbXSwgXyA9IFtdLCBwID0gZS5faW50ZXJuYWxzLnJlc2VydmVkUHJvcHM7XG4gICAgICAgICAgICBmb3IgKHQgPSBvLl90YXJnZXRzIHx8IG8udGFyZ2V0LCBEZSh0LCBoLCBfKSwgby5yZW5kZXIoaSwgITApLCBEZSh0LCB1KSwgby5yZW5kZXIoMCwgITApLCBvLl9lbmFibGVkKCEwKSwgciA9IF8ubGVuZ3RoOyAtLXIgPiAtMTspaWYgKG4gPSBHKF9bcl0sIGhbcl0sIHVbcl0pLCBuLmZpcnN0TVBUKSB7XG4gICAgICAgICAgICAgICAgbiA9IG4uZGlmcztcbiAgICAgICAgICAgICAgICBmb3IgKGEgaW4gcylwW2FdICYmIChuW2FdID0gc1thXSk7XG4gICAgICAgICAgICAgICAgbC5wdXNoKGUudG8oX1tyXSwgaSwgbikpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gbFxuICAgICAgICB9LCB0LmFjdGl2YXRlKFthXSksIGFcbiAgICB9LCAhMClcbn0pLCB3aW5kb3cuX2dzRGVmaW5lICYmIHdpbmRvdy5fZ3NRdWV1ZS5wb3AoKSgpOyIsIi8qIVxuICogVkVSU0lPTjogYmV0YSAxLjcuMVxuICogREFURTogMjAxMy0xMC0yM1xuICogVVBEQVRFUyBBTkQgRE9DUyBBVDogaHR0cDovL3d3dy5ncmVlbnNvY2suY29tXG4gKlxuICogQGxpY2Vuc2UgQ29weXJpZ2h0IChjKSAyMDA4LTIwMTMsIEdyZWVuU29jay4gQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqIFRoaXMgd29yayBpcyBzdWJqZWN0IHRvIHRoZSB0ZXJtcyBhdCBodHRwOi8vd3d3LmdyZWVuc29jay5jb20vdGVybXNfb2ZfdXNlLmh0bWwgb3IgZm9yXG4gKiBDbHViIEdyZWVuU29jayBtZW1iZXJzLCB0aGUgc29mdHdhcmUgYWdyZWVtZW50IHRoYXQgd2FzIGlzc3VlZCB3aXRoIHlvdXIgbWVtYmVyc2hpcC5cbiAqIFxuICogQGF1dGhvcjogSmFjayBEb3lsZSwgamFja0BncmVlbnNvY2suY29tXG4gKiovXG4od2luZG93Ll9nc1F1ZXVlIHx8ICh3aW5kb3cuX2dzUXVldWUgPSBbXSkpLnB1c2goZnVuY3Rpb24gKCkge1xuICAgIFwidXNlIHN0cmljdFwiO1xuICAgIHZhciB0ID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LCBlID0gd2luZG93LCBpID0gZnVuY3Rpb24gKGksIHMpIHtcbiAgICAgICAgdmFyIHIgPSBcInhcIiA9PT0gcyA/IFwiV2lkdGhcIiA6IFwiSGVpZ2h0XCIsIG4gPSBcInNjcm9sbFwiICsgciwgYSA9IFwiY2xpZW50XCIgKyByLCBvID0gZG9jdW1lbnQuYm9keTtcbiAgICAgICAgcmV0dXJuIGkgPT09IGUgfHwgaSA9PT0gdCB8fCBpID09PSBvID8gTWF0aC5tYXgodFtuXSwgb1tuXSkgLSAoZVtcImlubmVyXCIgKyByXSB8fCBNYXRoLm1heCh0W2FdLCBvW2FdKSkgOiBpW25dIC0gaVtcIm9mZnNldFwiICsgcl1cbiAgICB9LCBzID0gd2luZG93Ll9nc0RlZmluZS5wbHVnaW4oe3Byb3BOYW1lOiBcInNjcm9sbFRvXCIsIEFQSTogMiwgaW5pdDogZnVuY3Rpb24gKHQsIHMsIHIpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3dkdyA9IHQgPT09IGUsIHRoaXMuX3RhcmdldCA9IHQsIHRoaXMuX3R3ZWVuID0gciwgXCJvYmplY3RcIiAhPSB0eXBlb2YgcyAmJiAocyA9IHt5OiBzfSksIHRoaXMuX2F1dG9LaWxsID0gcy5hdXRvS2lsbCAhPT0gITEsIHRoaXMueCA9IHRoaXMueFByZXYgPSB0aGlzLmdldFgoKSwgdGhpcy55ID0gdGhpcy55UHJldiA9IHRoaXMuZ2V0WSgpLCBudWxsICE9IHMueCA/IHRoaXMuX2FkZFR3ZWVuKHRoaXMsIFwieFwiLCB0aGlzLngsIFwibWF4XCIgPT09IHMueCA/IGkodCwgXCJ4XCIpIDogcy54LCBcInNjcm9sbFRvX3hcIiwgITApIDogdGhpcy5za2lwWCA9ICEwLCBudWxsICE9IHMueSA/IHRoaXMuX2FkZFR3ZWVuKHRoaXMsIFwieVwiLCB0aGlzLnksIFwibWF4XCIgPT09IHMueSA/IGkodCwgXCJ5XCIpIDogcy55LCBcInNjcm9sbFRvX3lcIiwgITApIDogdGhpcy5za2lwWSA9ICEwLCAhMFxuICAgIH0sIHNldDogZnVuY3Rpb24gKHQpIHtcbiAgICAgICAgdGhpcy5fc3VwZXIuc2V0UmF0aW8uY2FsbCh0aGlzLCB0KTtcbiAgICAgICAgdmFyIGkgPSB0aGlzLl93ZHcgfHwgIXRoaXMuc2tpcFggPyB0aGlzLmdldFgoKSA6IHRoaXMueFByZXYsIHMgPSB0aGlzLl93ZHcgfHwgIXRoaXMuc2tpcFkgPyB0aGlzLmdldFkoKSA6IHRoaXMueVByZXYsIHIgPSBzIC0gdGhpcy55UHJldiwgbiA9IGkgLSB0aGlzLnhQcmV2O1xuICAgICAgICB0aGlzLl9hdXRvS2lsbCAmJiAoIXRoaXMuc2tpcFggJiYgKG4gPiA3IHx8IC03ID4gbikgJiYgKHRoaXMuc2tpcFggPSAhMCksICF0aGlzLnNraXBZICYmIChyID4gNyB8fCAtNyA+IHIpICYmICh0aGlzLnNraXBZID0gITApLCB0aGlzLnNraXBYICYmIHRoaXMuc2tpcFkgJiYgdGhpcy5fdHdlZW4ua2lsbCgpKSwgdGhpcy5fd2R3ID8gZS5zY3JvbGxUbyh0aGlzLnNraXBYID8gaSA6IHRoaXMueCwgdGhpcy5za2lwWSA/IHMgOiB0aGlzLnkpIDogKHRoaXMuc2tpcFkgfHwgKHRoaXMuX3RhcmdldC5zY3JvbGxUb3AgPSB0aGlzLnkpLCB0aGlzLnNraXBYIHx8ICh0aGlzLl90YXJnZXQuc2Nyb2xsTGVmdCA9IHRoaXMueCkpLCB0aGlzLnhQcmV2ID0gdGhpcy54LCB0aGlzLnlQcmV2ID0gdGhpcy55XG4gICAgfX0pLCByID0gcy5wcm90b3R5cGU7XG4gICAgcy5tYXggPSBpLCByLmdldFggPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl93ZHcgPyBudWxsICE9IGUucGFnZVhPZmZzZXQgPyBlLnBhZ2VYT2Zmc2V0IDogbnVsbCAhPSB0LnNjcm9sbExlZnQgPyB0LnNjcm9sbExlZnQgOiBkb2N1bWVudC5ib2R5LnNjcm9sbExlZnQgOiB0aGlzLl90YXJnZXQuc2Nyb2xsTGVmdFxuICAgIH0sIHIuZ2V0WSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3dkdyA/IG51bGwgIT0gZS5wYWdlWU9mZnNldCA/IGUucGFnZVlPZmZzZXQgOiBudWxsICE9IHQuc2Nyb2xsVG9wID8gdC5zY3JvbGxUb3AgOiBkb2N1bWVudC5ib2R5LnNjcm9sbFRvcCA6IHRoaXMuX3RhcmdldC5zY3JvbGxUb3BcbiAgICB9LCByLl9raWxsID0gZnVuY3Rpb24gKHQpIHtcbiAgICAgICAgcmV0dXJuIHQuc2Nyb2xsVG9feCAmJiAodGhpcy5za2lwWCA9ICEwKSwgdC5zY3JvbGxUb195ICYmICh0aGlzLnNraXBZID0gITApLCB0aGlzLl9zdXBlci5fa2lsbC5jYWxsKHRoaXMsIHQpXG4gICAgfVxufSksIHdpbmRvdy5fZ3NEZWZpbmUgJiYgd2luZG93Ll9nc1F1ZXVlLnBvcCgpKCk7Il19
