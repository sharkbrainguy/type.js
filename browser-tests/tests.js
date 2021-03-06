/*globals ok: false, test: false, equals: false, Type: false */
function throws(fn, type, message) {
    ok((function () {
        try {
            fn();
            return false;
        } catch (err) {
            return err instanceof type;
        }
    }()), message);
}

test("Check nulls", function () {
    ok(Type.check(null, null),      "null is Null");
    ok(Type.check(undefined, null), "undefined is Null");
    ok(Type.check(null, Type.Null), "using Type.Null");
    ok(!Type.check({}, Type.Null),   "Object is not null");
});

test("Check NaNs", function () {
    ok(Type.check(NaN, NaN),      "NaN");
    ok(Type.check(1/"p", NaN),    "NaN (division by string)");
    ok(Type.check(NaN, Type.NAN), "NaN using Type.NAN");
    ok(!Type.check(10,   NaN),    "Not a NaN");
});

test("Check Primitive classes", function () {
    ok(Type.check("testing", String), "String");
    ok(Type.check(10,   Number),      "Number");
    ok(Type.check(true, Boolean),     "Boolean");
    ok(Type.check([],   Array),       "Array");

    ok(Type.check(new String("cats"), String), "String with constructor");
    ok(Type.check(new Number(7),      Number),  "Number with constructor");
    ok(Type.check(new Boolean(true),  Boolean), "Boolean with constructor");
    ok(Type.check(new Array(10),      Array),   "Boolean with constructor");

    ok(!Type.check(10,   String),  "Not a String");
    ok(!Type.check("10", Number),  "Not a Number");
    ok(!Type.check(10,   Boolean), "Not a Boolean");
    ok(!Type.check(10,   Array),   "Not an Array");
});

test("Impersonating Builtin Types", function () {
    var instance, _number, _string, _boolean, _function, _array, _regexp;
    
    instance = function (_class) {
        var F = function (){};
        F.prototype = _class.prototype;
        return new F();
    };

    _number   = instance(Number);
    _string   = instance(String);
    _boolean  = instance(Boolean);
    _function = instance(Function);
    _array    = instance(Array);
    _regexp   = instance(RegExp);

    ok(_number instanceof Number, "Number impersonator passes instanceof");
    ok(!Type.check(_number, Number), "Number impersonator fails Type.check");

    ok(_string instanceof String, "String impersonator passes instanceof");
    ok(!Type.check(_string, String), "String impersonator fails Type.check");

    ok(_boolean instanceof Boolean, "Boolean impersonator passes instanceof");
    ok(!Type.check(_boolean, Boolean), "Boolean impersonator fails Type.check");

    ok(_function instanceof Function, "Function impersonator passes instanceof");
    ok(!Type.check(_function, Function), "Function impersonator fails Type.check");

    ok(_array instanceof Array, "Array impersonator passes instanceof");
    ok(!Type.check(_array, Array), "Array impersonator fails Type.check");

    ok(_regexp instanceof RegExp, "RegExp impersonator passes instanceof");
    ok(!Type.check(_regexp, RegExp), "RegExp impersonator fails Type.check");

    ok(!Type.check(/test/, Function), "a Regexp is not a Function");
});

test("Checking other builtin classes", function () {
    ok(Type.check(/poo/, RegExp), "regexp from literal");
    ok(Type.check(new RegExp("poo"), RegExp), "regexp from constructor");
    ok(!Type.check("poo", RegExp), "not a regexp");
});

test("What is Object?", function () {
    ok(Type.check({}, Object),   "{} is Object");
    ok(Type.check(new Object(), Object),   "new Object() is Object");

    ok(Type.check("", Object),   "\"\" is Object");
    ok(Type.check(new String(), Object),   "new String() is Object");

    ok(Type.check(function (){}, Object), "function () {} is Object");
    ok(Type.check(new Function(), Object), "new Function() is Object");

    ok(Type.check(1, Object),             "1 is Object");
    ok(Type.check(new Number(), Object),  "new Number() is Object");
    ok(Type.check(NaN, Object),           "NaN is Object");

    ok(!Type.check(null, Object),      "null is not Object");
    ok(!Type.check(undefined, Object), "undefined is not Object");
});

test("Type specificity", function () {
    ok(Type.moreSpecificThan(null, NaN));
    ok(Type.moreSpecificThan(NaN, Number));
    ok(Type.moreSpecificThan(Number, Object));
});

test("Multimethod dispatch", function () {
    var Cons, length, test, isList;

    Cons = function (a, b) {
        this.head = a;
        this.tail = b;
    };

    length = new Type.Generic();

    length.defineMethod([Cons], function (ls) {
        return 1 + length( ls.tail );
    });

    length.defineMethod([null], function (ls) {
        return 0;
    });

    isList = new Type.Generic();

    isList.defineMethod([ null ], function (ls) { return true; });

    isList.defineMethod([ Cons ], function (ls) {
        return isList(ls.tail);
    });

    isList.defineMethod([ Object ], function (ls) {
        return false;
    });

    test = new Cons(1, new Cons(2, null));

    ok(length(test) === 2, "length('(1 2)) is 2");

    ok(isList(null), "isList('())");
    ok(isList(test), "isList('(1 2))");

    ok(!isList(new Cons(1, 2)), "! isList('(1 . 2))");
});

test("Multimethod dispatch PART DEUX", function () {
    var classify, Integer;

    classify = new Type.Generic();

    Integer  = new Type.Specialized(Number, function (n) {
        return parseInt(n, 10) == n;
    });

    classify.defineMethod([ Number ], function (n) {
        return "number";
    });

    classify.defineMethod([ NaN ], function (n) {
        return "NaN";
    });

    classify.defineMethod([ Object ], function (n) {
        return "object";
    });

    classify.defineMethod([ Integer ], function (n) {
        return "integer";
    });

    classify.defineMethod([ Type.Null ], function (n) {
        return "null";
    });

    classify.defineMethod([ String ], function (n) {
        return "string";
    });

    equals(classify(1),      "integer");
    equals(classify(1.5),    "number");
    equals(classify(NaN),    "NaN");
    equals(classify({}),     "object");
    equals(classify(null),   "null");
    equals(classify("test"), "string");
});

test("Generic::defineMethods (define multiple methods)", function () {
    var classify, Integer;

    classify = new Type.Generic();

    Integer = new Type.Specialized(Number, function (n) {
        return parseInt(n, 10) == n;
    });

    classify.defineMethods(
        [ Number ], function (n) {
            return "number";
        },

        // Should be more specific than Number
        [ NaN ], function (n) {
            return "NaN";
        },

        // Should be less specific than Number
        [ Object ], function (n) {
            return "object";
        },

        // Should be more specific than Number
        [ Integer ], function (n) {
            return "integer";
        },

        [ null ], function (n) {
            return "null";
        },

        [ String ], function (n) {
            return "string";
        }
    );

    equals(classify(1),      "integer");
    equals(classify(1.5),    "number");
    equals(classify(NaN),    "NaN");
    equals(classify({}),     "object");
    equals(classify(null),   "null");
    equals(classify("test"), "string");
});

test("MultiMethod Example from README", function () {
    var reverse = new Type.Generic();

    reverse.defineMethods(
        [ Array ], function (arr) {
            return arr.reverse();
        },

        [ String ], function (str) {
            return str.split('').reverse().join('');    
        }
    );

    same(reverse("Hello World!"), "!dlroW olleH");
    same(reverse([1, 2, 3, 4, 5]), [5, 4, 3, 2, 1]);
});

test("proxy objects", function () {
    var inner, outer;

    inner = {
        a: 4,
        b: 9,

        total: function () {
            return this.a + this.b;
        },

        average: function () {
            return this.total() / 2; 
        },

        inRange: function (n) {
            return n > this.a && n < this.b;
        }
    };

    outer = Type.proxy(inner, {
        total: [Number],
        average: [Number],
        inRange: [Number, Boolean]
    });
    
    equals(outer.total(), 13, "call method through proxy");
    equals(outer.a, 4, "get property through proxy");
    equals(outer.b, 9, "get property through proxy");
    equals(outer.inRange(5), true, "call method through proxy");
    equals(outer.inRange(0), false, "call method through proxy");
    throws(function () { outer.inRange("string"); }, TypeError, "call method through proxy");
});

test("Type.defineClass", function (){
    var Dude, kev;

    Dude = Type.defineClass({
        'contract:initialize': [String, Number, null],
        initialize: function (name, age) {
            this.name = name;
            this.age = age;
        },

        'contract:speak': [String],
        speak: function () {
            return "My name is " + this.name;
        },

        'contract:name': String,
        name: "Guy",

        'contract:age': Number,
        age: 0
    });

    kev = new Dude("Kevin", 37); 

    equals(kev.name,             "Kevin", "property access on proxy");
    equals(kev.getName(),        "Kevin", "automatic getter getName()");
    equals(kev.age,              37,      "property access on proxy");
    equals(kev.getAge(),         37,      "automatic getter getName()");

    equals(kev.setName("K-Dog"), "K-Dog", "automatic setter setName()");
    equals(kev.getName(),        "K-Dog", "automatic getter getName()");
    equals(kev.name,             "K-Dog", "property access on proxy");

    equals(kev.setAge(25),       25,      "automatic setter setName()");
    equals(kev.getAge(),         25,      "automatic getter getName()");
    equals(kev.age,              25,      "property access on proxy");

    ok(Dude("John", 17) instanceof Dude,  "constructor without 'new' keyword");
    equals(Dude("John", 17).name,  "John","constructor without 'new' keyword");
    equals(Dude("John", 17).age,   17,    "constructor without 'new' keyword");
    throws(function (){ Dude(32, "John"); }, TypeError, "constructor without 'new', with bad arguments");

    throws(function(){ kev.setName(5); },  TypeError, "calling protected method with wrong type");
    throws(function(){ kev.setAge("5"); }, TypeError, "calling protected method with wrong type");
    throws(function(){ new Dude(); },      TypeError, "calling constructor with wrong types");
});

test("ArrayOf", function () {
    ok(Type.ArrayOf(Number).check([1, 2, 3]), "Check an Array of Numbers");
    ok(Type.ArrayOf(Number).check([]), "Check an empty Array");
    ok(!Type.ArrayOf(Number).check([1, "cats", 3]), "Check an Array of mixed types");
    ok(!Type.ArrayOf(Number).check(5), "Check a non-array");
});

test("Interfaces", function () {
    var Seq = new Type.Interface({
        first: [Seq, Type.Any],
        rest: [Seq, Seq],
        nth: [Seq, Number, Type.Any],
        isEmpty: [Seq, Boolean],
        length: [Seq, Number]
    });

    Seq.implement(Array, {
        first: function (seq) {
            return seq[0];
        },

        rest: function (seq) {
            return seq.slice(1);
        },

        nth: function (seq, n) {
            return seq[n];
        },

        isEmpty: function (seq) {
            return seq.length === 0;
        },

        length: function (seq) {
            return seq.length;
        }
    });

    var Stream = Type.defineClass({
        Implements: [ Seq ],

        initialize: function (first, rest) {
            this._first = first;
            this._rest = rest;
        },

        first: function () {
            return this._first;
        },

        rest: function () {
            return this._rest();
        },

        isEmpty: function () {
            return false;
        },

        nth: function (n) {
            var ls = this;

            while (n-- > 0) {
                ls = ls.rest();
            }

            return ls.first() ;
        },

        length: function () {
            var len = 0,
            ls = this; 

            while (!ls.isEmpty()) {
                len++;
                ls = ls.rest();
            }

            return len;
        }
    });

    var EmptyStream = Type.defineClass({
        Extends: Stream,
        first: function () { throw new Error(); },
        rest: function () { throw new Error(); },
        nth: function (n) { throw new Error(); },
        isEmpty: function () { return true; },
        length: function () { return 0; }
    });

    var reduce = new Type.Generic();

    reduce.defineMethod([Function, Seq, Type.Any], function (fn, ls, init) {
        while (!Seq.generics.isEmpty(ls)) {
            init = fn(Seq.generics.first(ls), init);
            ls = Seq.generics.rest(ls);
        }

        return init;
    });

    var testStream = new Stream(1, function () { 
        return new Stream(2, function () {
            return new EmptyStream();
        });
    });

    var testArray = [1, 2, 3, 4, 5];

    equals(reduce(function (a, b) { return a + b; }, testStream, 0), 3);
    equals(reduce(function (a, b) { return a + b; }, testArray, 0), 15);
});


test("Type.BuiltinClass", function () {
    equals(Type.from(Number), Type.Number);
    equals(Type.from(Boolean), Type.Boolean);
    equals(Type.from(String), Type.String);
    equals(Type.from(Array), Type.Array);
    equals(Type.from(Function), Type.Function);
    equals(Type.from(RegExp), Type.RegExp);
});

test("Type.Signature", function () {
    var sig = Type.Signature.from([Number, Number, Number]),
        fn = sig.wrap(function (a, b) {
            return a + b;
        });

    ok(Type.check(sig, Type.Signature), 'Signature.from returns a Signature');
    ok(Type.check(fn, Type.WrappedFunction), 'Signature::wrap returns a WrappedFunction');
    ok(Type.check(fn, Function), 'Signature::wrap returns a Function');
    ok(Type.check(fn.contract, Type.Signature), 'WrappedFunction::contract is a Signature');
    equals(fn(1, 6), 7, 'WrappedFunction maintains original behaviour...');
    throws(function () { fn('one', 'six'); }, TypeError, '... but checks the argTypes');
});
