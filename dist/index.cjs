const __importMetaUrl = require('url').pathToFileURL(__filename).href;
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// node_modules/@sinclair/typebox/typebox.js
var require_typebox = __commonJS({
  "node_modules/@sinclair/typebox/typebox.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.Type = exports2.StandardType = exports2.ExtendedTypeBuilder = exports2.StandardTypeBuilder = exports2.TypeBuilder = exports2.TemplateLiteralGenerator = exports2.TemplateLiteralFinite = exports2.TemplateLiteralParser = exports2.TemplateLiteralParserError = exports2.TemplateLiteralResolver = exports2.TemplateLiteralPattern = exports2.KeyResolver = exports2.ObjectMap = exports2.TypeClone = exports2.TypeExtends = exports2.TypeExtendsResult = exports2.ExtendsUndefined = exports2.TypeGuard = exports2.TypeGuardUnknownTypeError = exports2.FormatRegistry = exports2.TypeRegistry = exports2.PatternStringExact = exports2.PatternNumberExact = exports2.PatternBooleanExact = exports2.PatternString = exports2.PatternNumber = exports2.PatternBoolean = exports2.Kind = exports2.Hint = exports2.Modifier = void 0;
    exports2.Modifier = Symbol.for("TypeBox.Modifier");
    exports2.Hint = Symbol.for("TypeBox.Hint");
    exports2.Kind = Symbol.for("TypeBox.Kind");
    exports2.PatternBoolean = "(true|false)";
    exports2.PatternNumber = "(0|[1-9][0-9]*)";
    exports2.PatternString = "(.*)";
    exports2.PatternBooleanExact = `^${exports2.PatternBoolean}$`;
    exports2.PatternNumberExact = `^${exports2.PatternNumber}$`;
    exports2.PatternStringExact = `^${exports2.PatternString}$`;
    var TypeRegistry;
    (function(TypeRegistry2) {
      const map = /* @__PURE__ */ new Map();
      function Entries() {
        return new Map(map);
      }
      TypeRegistry2.Entries = Entries;
      function Clear() {
        return map.clear();
      }
      TypeRegistry2.Clear = Clear;
      function Has(kind) {
        return map.has(kind);
      }
      TypeRegistry2.Has = Has;
      function Set2(kind, func) {
        map.set(kind, func);
      }
      TypeRegistry2.Set = Set2;
      function Get(kind) {
        return map.get(kind);
      }
      TypeRegistry2.Get = Get;
    })(TypeRegistry = exports2.TypeRegistry || (exports2.TypeRegistry = {}));
    var FormatRegistry;
    (function(FormatRegistry2) {
      const map = /* @__PURE__ */ new Map();
      function Entries() {
        return new Map(map);
      }
      FormatRegistry2.Entries = Entries;
      function Clear() {
        return map.clear();
      }
      FormatRegistry2.Clear = Clear;
      function Has(format) {
        return map.has(format);
      }
      FormatRegistry2.Has = Has;
      function Set2(format, func) {
        map.set(format, func);
      }
      FormatRegistry2.Set = Set2;
      function Get(format) {
        return map.get(format);
      }
      FormatRegistry2.Get = Get;
    })(FormatRegistry = exports2.FormatRegistry || (exports2.FormatRegistry = {}));
    var TypeGuardUnknownTypeError = class extends Error {
      constructor(schema) {
        super("TypeGuard: Unknown type");
        this.schema = schema;
      }
    };
    exports2.TypeGuardUnknownTypeError = TypeGuardUnknownTypeError;
    var TypeGuard;
    (function(TypeGuard2) {
      function IsObject(value) {
        return typeof value === "object" && value !== null && !Array.isArray(value);
      }
      function IsArray(value) {
        return typeof value === "object" && value !== null && Array.isArray(value);
      }
      function IsPattern(value) {
        try {
          new RegExp(value);
          return true;
        } catch {
          return false;
        }
      }
      function IsControlCharacterFree(value) {
        if (typeof value !== "string")
          return false;
        for (let i = 0; i < value.length; i++) {
          const code = value.charCodeAt(i);
          if (code >= 7 && code <= 13 || code === 27 || code === 127) {
            return false;
          }
        }
        return true;
      }
      function IsBigInt(value) {
        return typeof value === "bigint";
      }
      function IsString(value) {
        return typeof value === "string";
      }
      function IsNumber(value) {
        return typeof value === "number" && globalThis.Number.isFinite(value);
      }
      function IsBoolean(value) {
        return typeof value === "boolean";
      }
      function IsOptionalBigInt(value) {
        return value === void 0 || value !== void 0 && IsBigInt(value);
      }
      function IsOptionalNumber(value) {
        return value === void 0 || value !== void 0 && IsNumber(value);
      }
      function IsOptionalBoolean(value) {
        return value === void 0 || value !== void 0 && IsBoolean(value);
      }
      function IsOptionalString(value) {
        return value === void 0 || value !== void 0 && IsString(value);
      }
      function IsOptionalPattern(value) {
        return value === void 0 || value !== void 0 && IsString(value) && IsControlCharacterFree(value) && IsPattern(value);
      }
      function IsOptionalFormat(value) {
        return value === void 0 || value !== void 0 && IsString(value) && IsControlCharacterFree(value);
      }
      function IsOptionalSchema(value) {
        return value === void 0 || TSchema(value);
      }
      function TAny(schema) {
        return TKind(schema) && schema[exports2.Kind] === "Any" && IsOptionalString(schema.$id);
      }
      TypeGuard2.TAny = TAny;
      function TArray(schema) {
        return TKind(schema) && schema[exports2.Kind] === "Array" && schema.type === "array" && IsOptionalString(schema.$id) && TSchema(schema.items) && IsOptionalNumber(schema.minItems) && IsOptionalNumber(schema.maxItems) && IsOptionalBoolean(schema.uniqueItems);
      }
      TypeGuard2.TArray = TArray;
      function TBigInt(schema) {
        return TKind(schema) && schema[exports2.Kind] === "BigInt" && schema.type === "null" && schema.typeOf === "BigInt" && IsOptionalString(schema.$id) && IsOptionalBigInt(schema.multipleOf) && IsOptionalBigInt(schema.minimum) && IsOptionalBigInt(schema.maximum) && IsOptionalBigInt(schema.exclusiveMinimum) && IsOptionalBigInt(schema.exclusiveMaximum);
      }
      TypeGuard2.TBigInt = TBigInt;
      function TBoolean(schema) {
        return TKind(schema) && schema[exports2.Kind] === "Boolean" && schema.type === "boolean" && IsOptionalString(schema.$id);
      }
      TypeGuard2.TBoolean = TBoolean;
      function TConstructor(schema) {
        if (!(TKind(schema) && schema[exports2.Kind] === "Constructor" && schema.type === "object" && schema.instanceOf === "Constructor" && IsOptionalString(schema.$id) && IsArray(schema.parameters) && TSchema(schema.returns))) {
          return false;
        }
        for (const parameter of schema.parameters) {
          if (!TSchema(parameter))
            return false;
        }
        return true;
      }
      TypeGuard2.TConstructor = TConstructor;
      function TDate(schema) {
        return TKind(schema) && schema[exports2.Kind] === "Date" && schema.type === "object" && schema.instanceOf === "Date" && IsOptionalString(schema.$id) && IsOptionalNumber(schema.minimumTimestamp) && IsOptionalNumber(schema.maximumTimestamp) && IsOptionalNumber(schema.exclusiveMinimumTimestamp) && IsOptionalNumber(schema.exclusiveMaximumTimestamp);
      }
      TypeGuard2.TDate = TDate;
      function TFunction(schema) {
        if (!(TKind(schema) && schema[exports2.Kind] === "Function" && schema.type === "object" && schema.instanceOf === "Function" && IsOptionalString(schema.$id) && IsArray(schema.parameters) && TSchema(schema.returns))) {
          return false;
        }
        for (const parameter of schema.parameters) {
          if (!TSchema(parameter))
            return false;
        }
        return true;
      }
      TypeGuard2.TFunction = TFunction;
      function TInteger(schema) {
        return TKind(schema) && schema[exports2.Kind] === "Integer" && schema.type === "integer" && IsOptionalString(schema.$id) && IsOptionalNumber(schema.multipleOf) && IsOptionalNumber(schema.minimum) && IsOptionalNumber(schema.maximum) && IsOptionalNumber(schema.exclusiveMinimum) && IsOptionalNumber(schema.exclusiveMaximum);
      }
      TypeGuard2.TInteger = TInteger;
      function TIntersect(schema) {
        if (!(TKind(schema) && schema[exports2.Kind] === "Intersect" && IsArray(schema.allOf) && IsOptionalString(schema.type) && (IsOptionalBoolean(schema.unevaluatedProperties) || IsOptionalSchema(schema.unevaluatedProperties)) && IsOptionalString(schema.$id))) {
          return false;
        }
        if ("type" in schema && schema.type !== "object") {
          return false;
        }
        for (const inner of schema.allOf) {
          if (!TSchema(inner))
            return false;
        }
        return true;
      }
      TypeGuard2.TIntersect = TIntersect;
      function TKind(schema) {
        return IsObject(schema) && exports2.Kind in schema && typeof schema[exports2.Kind] === "string";
      }
      TypeGuard2.TKind = TKind;
      function TLiteral(schema) {
        return TKind(schema) && schema[exports2.Kind] === "Literal" && IsOptionalString(schema.$id) && (IsString(schema.const) || IsNumber(schema.const) || IsBoolean(schema.const) || IsBigInt(schema.const));
      }
      TypeGuard2.TLiteral = TLiteral;
      function TNever(schema) {
        return TKind(schema) && schema[exports2.Kind] === "Never" && IsObject(schema.not) && globalThis.Object.getOwnPropertyNames(schema.not).length === 0;
      }
      TypeGuard2.TNever = TNever;
      function TNot(schema) {
        return TKind(schema) && schema[exports2.Kind] === "Not" && IsArray(schema.allOf) && schema.allOf.length === 2 && IsObject(schema.allOf[0]) && TSchema(schema.allOf[0].not) && TSchema(schema.allOf[1]);
      }
      TypeGuard2.TNot = TNot;
      function TNull(schema) {
        return TKind(schema) && schema[exports2.Kind] === "Null" && schema.type === "null" && IsOptionalString(schema.$id);
      }
      TypeGuard2.TNull = TNull;
      function TNumber(schema) {
        return TKind(schema) && schema[exports2.Kind] === "Number" && schema.type === "number" && IsOptionalString(schema.$id) && IsOptionalNumber(schema.multipleOf) && IsOptionalNumber(schema.minimum) && IsOptionalNumber(schema.maximum) && IsOptionalNumber(schema.exclusiveMinimum) && IsOptionalNumber(schema.exclusiveMaximum);
      }
      TypeGuard2.TNumber = TNumber;
      function TObject(schema) {
        if (!(TKind(schema) && schema[exports2.Kind] === "Object" && schema.type === "object" && IsOptionalString(schema.$id) && IsObject(schema.properties) && (IsOptionalBoolean(schema.additionalProperties) || IsOptionalSchema(schema.additionalProperties)) && IsOptionalNumber(schema.minProperties) && IsOptionalNumber(schema.maxProperties))) {
          return false;
        }
        for (const [key, value] of Object.entries(schema.properties)) {
          if (!IsControlCharacterFree(key))
            return false;
          if (!TSchema(value))
            return false;
        }
        return true;
      }
      TypeGuard2.TObject = TObject;
      function TPromise(schema) {
        return TKind(schema) && schema[exports2.Kind] === "Promise" && schema.type === "object" && schema.instanceOf === "Promise" && IsOptionalString(schema.$id) && TSchema(schema.item);
      }
      TypeGuard2.TPromise = TPromise;
      function TRecord(schema) {
        if (!(TKind(schema) && schema[exports2.Kind] === "Record" && schema.type === "object" && IsOptionalString(schema.$id) && schema.additionalProperties === false && IsObject(schema.patternProperties))) {
          return false;
        }
        const keys = Object.keys(schema.patternProperties);
        if (keys.length !== 1) {
          return false;
        }
        if (!IsPattern(keys[0])) {
          return false;
        }
        if (!TSchema(schema.patternProperties[keys[0]])) {
          return false;
        }
        return true;
      }
      TypeGuard2.TRecord = TRecord;
      function TRef(schema) {
        return TKind(schema) && schema[exports2.Kind] === "Ref" && IsOptionalString(schema.$id) && IsString(schema.$ref);
      }
      TypeGuard2.TRef = TRef;
      function TString(schema) {
        return TKind(schema) && schema[exports2.Kind] === "String" && schema.type === "string" && IsOptionalString(schema.$id) && IsOptionalNumber(schema.minLength) && IsOptionalNumber(schema.maxLength) && IsOptionalPattern(schema.pattern) && IsOptionalFormat(schema.format);
      }
      TypeGuard2.TString = TString;
      function TSymbol(schema) {
        return TKind(schema) && schema[exports2.Kind] === "Symbol" && schema.type === "null" && schema.typeOf === "Symbol" && IsOptionalString(schema.$id);
      }
      TypeGuard2.TSymbol = TSymbol;
      function TTemplateLiteral(schema) {
        return TKind(schema) && schema[exports2.Kind] === "TemplateLiteral" && schema.type === "string" && IsString(schema.pattern) && schema.pattern[0] === "^" && schema.pattern[schema.pattern.length - 1] === "$";
      }
      TypeGuard2.TTemplateLiteral = TTemplateLiteral;
      function TThis(schema) {
        return TKind(schema) && schema[exports2.Kind] === "This" && IsOptionalString(schema.$id) && IsString(schema.$ref);
      }
      TypeGuard2.TThis = TThis;
      function TTuple(schema) {
        if (!(TKind(schema) && schema[exports2.Kind] === "Tuple" && schema.type === "array" && IsOptionalString(schema.$id) && IsNumber(schema.minItems) && IsNumber(schema.maxItems) && schema.minItems === schema.maxItems)) {
          return false;
        }
        if (schema.items === void 0 && schema.additionalItems === void 0 && schema.minItems === 0) {
          return true;
        }
        if (!IsArray(schema.items)) {
          return false;
        }
        for (const inner of schema.items) {
          if (!TSchema(inner))
            return false;
        }
        return true;
      }
      TypeGuard2.TTuple = TTuple;
      function TUndefined(schema) {
        return TKind(schema) && schema[exports2.Kind] === "Undefined" && schema.type === "null" && schema.typeOf === "Undefined" && IsOptionalString(schema.$id);
      }
      TypeGuard2.TUndefined = TUndefined;
      function TUnion(schema) {
        if (!(TKind(schema) && schema[exports2.Kind] === "Union" && IsArray(schema.anyOf) && IsOptionalString(schema.$id))) {
          return false;
        }
        for (const inner of schema.anyOf) {
          if (!TSchema(inner))
            return false;
        }
        return true;
      }
      TypeGuard2.TUnion = TUnion;
      function TUnionLiteral(schema) {
        return TUnion(schema) && schema.anyOf.every((schema2) => TLiteral(schema2) && typeof schema2.const === "string");
      }
      TypeGuard2.TUnionLiteral = TUnionLiteral;
      function TUint8Array(schema) {
        return TKind(schema) && schema[exports2.Kind] === "Uint8Array" && schema.type === "object" && IsOptionalString(schema.$id) && schema.instanceOf === "Uint8Array" && IsOptionalNumber(schema.minByteLength) && IsOptionalNumber(schema.maxByteLength);
      }
      TypeGuard2.TUint8Array = TUint8Array;
      function TUnknown(schema) {
        return TKind(schema) && schema[exports2.Kind] === "Unknown" && IsOptionalString(schema.$id);
      }
      TypeGuard2.TUnknown = TUnknown;
      function TUnsafe(schema) {
        return TKind(schema) && schema[exports2.Kind] === "Unsafe";
      }
      TypeGuard2.TUnsafe = TUnsafe;
      function TVoid(schema) {
        return TKind(schema) && schema[exports2.Kind] === "Void" && schema.type === "null" && schema.typeOf === "Void" && IsOptionalString(schema.$id);
      }
      TypeGuard2.TVoid = TVoid;
      function TReadonlyOptional(schema) {
        return IsObject(schema) && schema[exports2.Modifier] === "ReadonlyOptional";
      }
      TypeGuard2.TReadonlyOptional = TReadonlyOptional;
      function TReadonly(schema) {
        return IsObject(schema) && schema[exports2.Modifier] === "Readonly";
      }
      TypeGuard2.TReadonly = TReadonly;
      function TOptional(schema) {
        return IsObject(schema) && schema[exports2.Modifier] === "Optional";
      }
      TypeGuard2.TOptional = TOptional;
      function TSchema(schema) {
        return typeof schema === "object" && (TAny(schema) || TArray(schema) || TBoolean(schema) || TBigInt(schema) || TConstructor(schema) || TDate(schema) || TFunction(schema) || TInteger(schema) || TIntersect(schema) || TLiteral(schema) || TNever(schema) || TNot(schema) || TNull(schema) || TNumber(schema) || TObject(schema) || TPromise(schema) || TRecord(schema) || TRef(schema) || TString(schema) || TSymbol(schema) || TTemplateLiteral(schema) || TThis(schema) || TTuple(schema) || TUndefined(schema) || TUnion(schema) || TUint8Array(schema) || TUnknown(schema) || TUnsafe(schema) || TVoid(schema) || TKind(schema) && TypeRegistry.Has(schema[exports2.Kind]));
      }
      TypeGuard2.TSchema = TSchema;
    })(TypeGuard = exports2.TypeGuard || (exports2.TypeGuard = {}));
    var ExtendsUndefined;
    (function(ExtendsUndefined2) {
      function Check(schema) {
        if (schema[exports2.Kind] === "Undefined")
          return true;
        if (schema[exports2.Kind] === "Union") {
          const union = schema;
          return union.anyOf.some((schema2) => Check(schema2));
        }
        return false;
      }
      ExtendsUndefined2.Check = Check;
    })(ExtendsUndefined = exports2.ExtendsUndefined || (exports2.ExtendsUndefined = {}));
    var TypeExtendsResult;
    (function(TypeExtendsResult2) {
      TypeExtendsResult2[TypeExtendsResult2["Union"] = 0] = "Union";
      TypeExtendsResult2[TypeExtendsResult2["True"] = 1] = "True";
      TypeExtendsResult2[TypeExtendsResult2["False"] = 2] = "False";
    })(TypeExtendsResult = exports2.TypeExtendsResult || (exports2.TypeExtendsResult = {}));
    var TypeExtends;
    (function(TypeExtends2) {
      function IntoBooleanResult(result) {
        return result === TypeExtendsResult.False ? TypeExtendsResult.False : TypeExtendsResult.True;
      }
      function AnyRight(left, right) {
        return TypeExtendsResult.True;
      }
      function Any(left, right) {
        if (TypeGuard.TIntersect(right))
          return IntersectRight(left, right);
        if (TypeGuard.TUnion(right) && right.anyOf.some((schema) => TypeGuard.TAny(schema) || TypeGuard.TUnknown(schema)))
          return TypeExtendsResult.True;
        if (TypeGuard.TUnion(right))
          return TypeExtendsResult.Union;
        if (TypeGuard.TUnknown(right))
          return TypeExtendsResult.True;
        if (TypeGuard.TAny(right))
          return TypeExtendsResult.True;
        return TypeExtendsResult.Union;
      }
      function ArrayRight(left, right) {
        if (TypeGuard.TUnknown(left))
          return TypeExtendsResult.False;
        if (TypeGuard.TAny(left))
          return TypeExtendsResult.Union;
        if (TypeGuard.TNever(left))
          return TypeExtendsResult.True;
        return TypeExtendsResult.False;
      }
      function Array2(left, right) {
        if (TypeGuard.TIntersect(right))
          return IntersectRight(left, right);
        if (TypeGuard.TUnion(right))
          return UnionRight(left, right);
        if (TypeGuard.TUnknown(right))
          return UnknownRight(left, right);
        if (TypeGuard.TAny(right))
          return AnyRight(left, right);
        if (TypeGuard.TObject(right) && IsObjectArrayLike(right))
          return TypeExtendsResult.True;
        if (!TypeGuard.TArray(right))
          return TypeExtendsResult.False;
        return IntoBooleanResult(Visit(left.items, right.items));
      }
      function BigInt(left, right) {
        if (TypeGuard.TIntersect(right))
          return IntersectRight(left, right);
        if (TypeGuard.TUnion(right))
          return UnionRight(left, right);
        if (TypeGuard.TNever(right))
          return NeverRight(left, right);
        if (TypeGuard.TUnknown(right))
          return UnknownRight(left, right);
        if (TypeGuard.TAny(right))
          return AnyRight(left, right);
        if (TypeGuard.TObject(right))
          return ObjectRight(left, right);
        if (TypeGuard.TRecord(right))
          return RecordRight(left, right);
        return TypeGuard.TBigInt(right) ? TypeExtendsResult.True : TypeExtendsResult.False;
      }
      function BooleanRight(left, right) {
        if (TypeGuard.TLiteral(left) && typeof left.const === "boolean")
          return TypeExtendsResult.True;
        return TypeGuard.TBoolean(left) ? TypeExtendsResult.True : TypeExtendsResult.False;
      }
      function Boolean2(left, right) {
        if (TypeGuard.TIntersect(right))
          return IntersectRight(left, right);
        if (TypeGuard.TUnion(right))
          return UnionRight(left, right);
        if (TypeGuard.TNever(right))
          return NeverRight(left, right);
        if (TypeGuard.TUnknown(right))
          return UnknownRight(left, right);
        if (TypeGuard.TAny(right))
          return AnyRight(left, right);
        if (TypeGuard.TObject(right))
          return ObjectRight(left, right);
        if (TypeGuard.TRecord(right))
          return RecordRight(left, right);
        return TypeGuard.TBoolean(right) ? TypeExtendsResult.True : TypeExtendsResult.False;
      }
      function Constructor(left, right) {
        if (TypeGuard.TIntersect(right))
          return IntersectRight(left, right);
        if (TypeGuard.TUnion(right))
          return UnionRight(left, right);
        if (TypeGuard.TUnknown(right))
          return UnknownRight(left, right);
        if (TypeGuard.TAny(right))
          return AnyRight(left, right);
        if (TypeGuard.TObject(right))
          return ObjectRight(left, right);
        if (!TypeGuard.TConstructor(right))
          return TypeExtendsResult.False;
        if (left.parameters.length > right.parameters.length)
          return TypeExtendsResult.False;
        if (!left.parameters.every((schema, index) => IntoBooleanResult(Visit(right.parameters[index], schema)) === TypeExtendsResult.True)) {
          return TypeExtendsResult.False;
        }
        return IntoBooleanResult(Visit(left.returns, right.returns));
      }
      function Date2(left, right) {
        if (TypeGuard.TIntersect(right))
          return IntersectRight(left, right);
        if (TypeGuard.TUnion(right))
          return UnionRight(left, right);
        if (TypeGuard.TUnknown(right))
          return UnknownRight(left, right);
        if (TypeGuard.TAny(right))
          return AnyRight(left, right);
        if (TypeGuard.TObject(right))
          return ObjectRight(left, right);
        if (TypeGuard.TRecord(right))
          return RecordRight(left, right);
        return TypeGuard.TDate(right) ? TypeExtendsResult.True : TypeExtendsResult.False;
      }
      function Function(left, right) {
        if (TypeGuard.TIntersect(right))
          return IntersectRight(left, right);
        if (TypeGuard.TUnion(right))
          return UnionRight(left, right);
        if (TypeGuard.TUnknown(right))
          return UnknownRight(left, right);
        if (TypeGuard.TAny(right))
          return AnyRight(left, right);
        if (TypeGuard.TObject(right))
          return ObjectRight(left, right);
        if (!TypeGuard.TFunction(right))
          return TypeExtendsResult.False;
        if (left.parameters.length > right.parameters.length)
          return TypeExtendsResult.False;
        if (!left.parameters.every((schema, index) => IntoBooleanResult(Visit(right.parameters[index], schema)) === TypeExtendsResult.True)) {
          return TypeExtendsResult.False;
        }
        return IntoBooleanResult(Visit(left.returns, right.returns));
      }
      function IntegerRight(left, right) {
        if (TypeGuard.TLiteral(left) && typeof left.const === "number")
          return TypeExtendsResult.True;
        return TypeGuard.TNumber(left) || TypeGuard.TInteger(left) ? TypeExtendsResult.True : TypeExtendsResult.False;
      }
      function Integer(left, right) {
        if (TypeGuard.TIntersect(right))
          return IntersectRight(left, right);
        if (TypeGuard.TUnion(right))
          return UnionRight(left, right);
        if (TypeGuard.TNever(right))
          return NeverRight(left, right);
        if (TypeGuard.TUnknown(right))
          return UnknownRight(left, right);
        if (TypeGuard.TAny(right))
          return AnyRight(left, right);
        if (TypeGuard.TObject(right))
          return ObjectRight(left, right);
        if (TypeGuard.TRecord(right))
          return RecordRight(left, right);
        return TypeGuard.TInteger(right) || TypeGuard.TNumber(right) ? TypeExtendsResult.True : TypeExtendsResult.False;
      }
      function IntersectRight(left, right) {
        return right.allOf.every((schema) => Visit(left, schema) === TypeExtendsResult.True) ? TypeExtendsResult.True : TypeExtendsResult.False;
      }
      function Intersect(left, right) {
        return left.allOf.some((schema) => Visit(schema, right) === TypeExtendsResult.True) ? TypeExtendsResult.True : TypeExtendsResult.False;
      }
      function IsLiteralString(schema) {
        return typeof schema.const === "string";
      }
      function IsLiteralNumber(schema) {
        return typeof schema.const === "number";
      }
      function IsLiteralBoolean(schema) {
        return typeof schema.const === "boolean";
      }
      function Literal(left, right) {
        if (TypeGuard.TIntersect(right))
          return IntersectRight(left, right);
        if (TypeGuard.TUnion(right))
          return UnionRight(left, right);
        if (TypeGuard.TNever(right))
          return NeverRight(left, right);
        if (TypeGuard.TUnknown(right))
          return UnknownRight(left, right);
        if (TypeGuard.TAny(right))
          return AnyRight(left, right);
        if (TypeGuard.TObject(right))
          return ObjectRight(left, right);
        if (TypeGuard.TRecord(right))
          return RecordRight(left, right);
        if (TypeGuard.TString(right))
          return StringRight(left, right);
        if (TypeGuard.TNumber(right))
          return NumberRight(left, right);
        if (TypeGuard.TInteger(right))
          return IntegerRight(left, right);
        if (TypeGuard.TBoolean(right))
          return BooleanRight(left, right);
        return TypeGuard.TLiteral(right) && right.const === left.const ? TypeExtendsResult.True : TypeExtendsResult.False;
      }
      function NeverRight(left, right) {
        return TypeExtendsResult.False;
      }
      function Never(left, right) {
        return TypeExtendsResult.True;
      }
      function Null(left, right) {
        if (TypeGuard.TIntersect(right))
          return IntersectRight(left, right);
        if (TypeGuard.TUnion(right))
          return UnionRight(left, right);
        if (TypeGuard.TNever(right))
          return NeverRight(left, right);
        if (TypeGuard.TUnknown(right))
          return UnknownRight(left, right);
        if (TypeGuard.TAny(right))
          return AnyRight(left, right);
        if (TypeGuard.TObject(right))
          return ObjectRight(left, right);
        if (TypeGuard.TRecord(right))
          return RecordRight(left, right);
        return TypeGuard.TNull(right) ? TypeExtendsResult.True : TypeExtendsResult.False;
      }
      function NumberRight(left, right) {
        if (TypeGuard.TLiteral(left) && IsLiteralNumber(left))
          return TypeExtendsResult.True;
        return TypeGuard.TNumber(left) || TypeGuard.TInteger(left) ? TypeExtendsResult.True : TypeExtendsResult.False;
      }
      function Number2(left, right) {
        if (TypeGuard.TIntersect(right))
          return IntersectRight(left, right);
        if (TypeGuard.TUnion(right))
          return UnionRight(left, right);
        if (TypeGuard.TNever(right))
          return NeverRight(left, right);
        if (TypeGuard.TUnknown(right))
          return UnknownRight(left, right);
        if (TypeGuard.TAny(right))
          return AnyRight(left, right);
        if (TypeGuard.TObject(right))
          return ObjectRight(left, right);
        if (TypeGuard.TRecord(right))
          return RecordRight(left, right);
        return TypeGuard.TInteger(right) || TypeGuard.TNumber(right) ? TypeExtendsResult.True : TypeExtendsResult.False;
      }
      function IsObjectPropertyCount(schema, count) {
        return globalThis.Object.keys(schema.properties).length === count;
      }
      function IsObjectStringLike(schema) {
        return IsObjectArrayLike(schema);
      }
      function IsObjectSymbolLike(schema) {
        return IsObjectPropertyCount(schema, 0) || IsObjectPropertyCount(schema, 1) && "description" in schema.properties && TypeGuard.TUnion(schema.properties.description) && schema.properties.description.anyOf.length === 2 && (TypeGuard.TString(schema.properties.description.anyOf[0]) && TypeGuard.TUndefined(schema.properties.description.anyOf[1]) || TypeGuard.TString(schema.properties.description.anyOf[1]) && TypeGuard.TUndefined(schema.properties.description.anyOf[0]));
      }
      function IsObjectNumberLike(schema) {
        return IsObjectPropertyCount(schema, 0);
      }
      function IsObjectBooleanLike(schema) {
        return IsObjectPropertyCount(schema, 0);
      }
      function IsObjectBigIntLike(schema) {
        return IsObjectPropertyCount(schema, 0);
      }
      function IsObjectDateLike(schema) {
        return IsObjectPropertyCount(schema, 0);
      }
      function IsObjectUint8ArrayLike(schema) {
        return IsObjectArrayLike(schema);
      }
      function IsObjectFunctionLike(schema) {
        const length = exports2.Type.Number();
        return IsObjectPropertyCount(schema, 0) || IsObjectPropertyCount(schema, 1) && "length" in schema.properties && IntoBooleanResult(Visit(schema.properties["length"], length)) === TypeExtendsResult.True;
      }
      function IsObjectConstructorLike(schema) {
        return IsObjectPropertyCount(schema, 0);
      }
      function IsObjectArrayLike(schema) {
        const length = exports2.Type.Number();
        return IsObjectPropertyCount(schema, 0) || IsObjectPropertyCount(schema, 1) && "length" in schema.properties && IntoBooleanResult(Visit(schema.properties["length"], length)) === TypeExtendsResult.True;
      }
      function IsObjectPromiseLike(schema) {
        const then = exports2.Type.Function([exports2.Type.Any()], exports2.Type.Any());
        return IsObjectPropertyCount(schema, 0) || IsObjectPropertyCount(schema, 1) && "then" in schema.properties && IntoBooleanResult(Visit(schema.properties["then"], then)) === TypeExtendsResult.True;
      }
      function Property(left, right) {
        if (Visit(left, right) === TypeExtendsResult.False)
          return TypeExtendsResult.False;
        if (TypeGuard.TOptional(left) && !TypeGuard.TOptional(right))
          return TypeExtendsResult.False;
        return TypeExtendsResult.True;
      }
      function ObjectRight(left, right) {
        if (TypeGuard.TUnknown(left))
          return TypeExtendsResult.False;
        if (TypeGuard.TAny(left))
          return TypeExtendsResult.Union;
        if (TypeGuard.TNever(left))
          return TypeExtendsResult.True;
        if (TypeGuard.TLiteral(left) && IsLiteralString(left) && IsObjectStringLike(right))
          return TypeExtendsResult.True;
        if (TypeGuard.TLiteral(left) && IsLiteralNumber(left) && IsObjectNumberLike(right))
          return TypeExtendsResult.True;
        if (TypeGuard.TLiteral(left) && IsLiteralBoolean(left) && IsObjectBooleanLike(right))
          return TypeExtendsResult.True;
        if (TypeGuard.TSymbol(left) && IsObjectSymbolLike(right))
          return TypeExtendsResult.True;
        if (TypeGuard.TBigInt(left) && IsObjectBigIntLike(right))
          return TypeExtendsResult.True;
        if (TypeGuard.TString(left) && IsObjectStringLike(right))
          return TypeExtendsResult.True;
        if (TypeGuard.TSymbol(left) && IsObjectSymbolLike(right))
          return TypeExtendsResult.True;
        if (TypeGuard.TNumber(left) && IsObjectNumberLike(right))
          return TypeExtendsResult.True;
        if (TypeGuard.TInteger(left) && IsObjectNumberLike(right))
          return TypeExtendsResult.True;
        if (TypeGuard.TBoolean(left) && IsObjectBooleanLike(right))
          return TypeExtendsResult.True;
        if (TypeGuard.TUint8Array(left) && IsObjectUint8ArrayLike(right))
          return TypeExtendsResult.True;
        if (TypeGuard.TDate(left) && IsObjectDateLike(right))
          return TypeExtendsResult.True;
        if (TypeGuard.TConstructor(left) && IsObjectConstructorLike(right))
          return TypeExtendsResult.True;
        if (TypeGuard.TFunction(left) && IsObjectFunctionLike(right))
          return TypeExtendsResult.True;
        if (TypeGuard.TRecord(left) && TypeGuard.TString(RecordKey(left))) {
          return right[exports2.Hint] === "Record" ? TypeExtendsResult.True : TypeExtendsResult.False;
        }
        if (TypeGuard.TRecord(left) && TypeGuard.TNumber(RecordKey(left))) {
          return IsObjectPropertyCount(right, 0) ? TypeExtendsResult.True : TypeExtendsResult.False;
        }
        return TypeExtendsResult.False;
      }
      function Object2(left, right) {
        if (TypeGuard.TIntersect(right))
          return IntersectRight(left, right);
        if (TypeGuard.TUnion(right))
          return UnionRight(left, right);
        if (TypeGuard.TUnknown(right))
          return UnknownRight(left, right);
        if (TypeGuard.TAny(right))
          return AnyRight(left, right);
        if (TypeGuard.TRecord(right))
          return RecordRight(left, right);
        if (!TypeGuard.TObject(right))
          return TypeExtendsResult.False;
        for (const key of globalThis.Object.keys(right.properties)) {
          if (!(key in left.properties))
            return TypeExtendsResult.False;
          if (Property(left.properties[key], right.properties[key]) === TypeExtendsResult.False) {
            return TypeExtendsResult.False;
          }
        }
        return TypeExtendsResult.True;
      }
      function Promise2(left, right) {
        if (TypeGuard.TIntersect(right))
          return IntersectRight(left, right);
        if (TypeGuard.TUnion(right))
          return UnionRight(left, right);
        if (TypeGuard.TUnknown(right))
          return UnknownRight(left, right);
        if (TypeGuard.TAny(right))
          return AnyRight(left, right);
        if (TypeGuard.TObject(right) && IsObjectPromiseLike(right))
          return TypeExtendsResult.True;
        if (!TypeGuard.TPromise(right))
          return TypeExtendsResult.False;
        return IntoBooleanResult(Visit(left.item, right.item));
      }
      function RecordKey(schema) {
        if (exports2.PatternNumberExact in schema.patternProperties)
          return exports2.Type.Number();
        if (exports2.PatternStringExact in schema.patternProperties)
          return exports2.Type.String();
        throw Error("TypeExtends: Cannot get record key");
      }
      function RecordValue(schema) {
        if (exports2.PatternNumberExact in schema.patternProperties)
          return schema.patternProperties[exports2.PatternNumberExact];
        if (exports2.PatternStringExact in schema.patternProperties)
          return schema.patternProperties[exports2.PatternStringExact];
        throw Error("TypeExtends: Cannot get record value");
      }
      function RecordRight(left, right) {
        const Key = RecordKey(right);
        const Value = RecordValue(right);
        if (TypeGuard.TLiteral(left) && IsLiteralString(left) && TypeGuard.TNumber(Key) && IntoBooleanResult(Visit(left, Value)) === TypeExtendsResult.True)
          return TypeExtendsResult.True;
        if (TypeGuard.TUint8Array(left) && TypeGuard.TNumber(Key))
          return Visit(left, Value);
        if (TypeGuard.TString(left) && TypeGuard.TNumber(Key))
          return Visit(left, Value);
        if (TypeGuard.TArray(left) && TypeGuard.TNumber(Key))
          return Visit(left, Value);
        if (TypeGuard.TObject(left)) {
          for (const key of globalThis.Object.keys(left.properties)) {
            if (Property(Value, left.properties[key]) === TypeExtendsResult.False) {
              return TypeExtendsResult.False;
            }
          }
          return TypeExtendsResult.True;
        }
        return TypeExtendsResult.False;
      }
      function Record(left, right) {
        const Value = RecordValue(left);
        if (TypeGuard.TIntersect(right))
          return IntersectRight(left, right);
        if (TypeGuard.TUnion(right))
          return UnionRight(left, right);
        if (TypeGuard.TUnknown(right))
          return UnknownRight(left, right);
        if (TypeGuard.TAny(right))
          return AnyRight(left, right);
        if (TypeGuard.TObject(right))
          return ObjectRight(left, right);
        if (!TypeGuard.TRecord(right))
          return TypeExtendsResult.False;
        return Visit(Value, RecordValue(right));
      }
      function StringRight(left, right) {
        if (TypeGuard.TLiteral(left) && typeof left.const === "string")
          return TypeExtendsResult.True;
        return TypeGuard.TString(left) ? TypeExtendsResult.True : TypeExtendsResult.False;
      }
      function String2(left, right) {
        if (TypeGuard.TIntersect(right))
          return IntersectRight(left, right);
        if (TypeGuard.TUnion(right))
          return UnionRight(left, right);
        if (TypeGuard.TNever(right))
          return NeverRight(left, right);
        if (TypeGuard.TUnknown(right))
          return UnknownRight(left, right);
        if (TypeGuard.TAny(right))
          return AnyRight(left, right);
        if (TypeGuard.TObject(right))
          return ObjectRight(left, right);
        if (TypeGuard.TRecord(right))
          return RecordRight(left, right);
        return TypeGuard.TString(right) ? TypeExtendsResult.True : TypeExtendsResult.False;
      }
      function Symbol2(left, right) {
        if (TypeGuard.TIntersect(right))
          return IntersectRight(left, right);
        if (TypeGuard.TUnion(right))
          return UnionRight(left, right);
        if (TypeGuard.TNever(right))
          return NeverRight(left, right);
        if (TypeGuard.TUnknown(right))
          return UnknownRight(left, right);
        if (TypeGuard.TAny(right))
          return AnyRight(left, right);
        if (TypeGuard.TObject(right))
          return ObjectRight(left, right);
        if (TypeGuard.TRecord(right))
          return RecordRight(left, right);
        return TypeGuard.TSymbol(right) ? TypeExtendsResult.True : TypeExtendsResult.False;
      }
      function TupleRight(left, right) {
        if (TypeGuard.TUnknown(left))
          return TypeExtendsResult.False;
        if (TypeGuard.TAny(left))
          return TypeExtendsResult.Union;
        if (TypeGuard.TNever(left))
          return TypeExtendsResult.True;
        return TypeExtendsResult.False;
      }
      function IsArrayOfTuple(left, right) {
        return TypeGuard.TArray(right) && left.items !== void 0 && left.items.every((schema) => Visit(schema, right.items) === TypeExtendsResult.True);
      }
      function Tuple(left, right) {
        if (TypeGuard.TIntersect(right))
          return IntersectRight(left, right);
        if (TypeGuard.TUnion(right))
          return UnionRight(left, right);
        if (TypeGuard.TUnknown(right))
          return UnknownRight(left, right);
        if (TypeGuard.TAny(right))
          return AnyRight(left, right);
        if (TypeGuard.TObject(right) && IsObjectArrayLike(right))
          return TypeExtendsResult.True;
        if (TypeGuard.TArray(right) && IsArrayOfTuple(left, right))
          return TypeExtendsResult.True;
        if (!TypeGuard.TTuple(right))
          return TypeExtendsResult.False;
        if (left.items === void 0 && right.items !== void 0 || left.items !== void 0 && right.items === void 0)
          return TypeExtendsResult.False;
        if (left.items === void 0 && right.items === void 0)
          return TypeExtendsResult.True;
        return left.items.every((schema, index) => Visit(schema, right.items[index]) === TypeExtendsResult.True) ? TypeExtendsResult.True : TypeExtendsResult.False;
      }
      function Uint8Array2(left, right) {
        if (TypeGuard.TIntersect(right))
          return IntersectRight(left, right);
        if (TypeGuard.TUnion(right))
          return UnionRight(left, right);
        if (TypeGuard.TUnknown(right))
          return UnknownRight(left, right);
        if (TypeGuard.TAny(right))
          return AnyRight(left, right);
        if (TypeGuard.TObject(right))
          return ObjectRight(left, right);
        if (TypeGuard.TRecord(right))
          return RecordRight(left, right);
        return TypeGuard.TUint8Array(right) ? TypeExtendsResult.True : TypeExtendsResult.False;
      }
      function Undefined(left, right) {
        if (TypeGuard.TIntersect(right))
          return IntersectRight(left, right);
        if (TypeGuard.TUnion(right))
          return UnionRight(left, right);
        if (TypeGuard.TNever(right))
          return NeverRight(left, right);
        if (TypeGuard.TUnknown(right))
          return UnknownRight(left, right);
        if (TypeGuard.TAny(right))
          return AnyRight(left, right);
        if (TypeGuard.TObject(right))
          return ObjectRight(left, right);
        if (TypeGuard.TRecord(right))
          return RecordRight(left, right);
        if (TypeGuard.TVoid(right))
          return VoidRight(left, right);
        return TypeGuard.TUndefined(right) ? TypeExtendsResult.True : TypeExtendsResult.False;
      }
      function UnionRight(left, right) {
        return right.anyOf.some((schema) => Visit(left, schema) === TypeExtendsResult.True) ? TypeExtendsResult.True : TypeExtendsResult.False;
      }
      function Union(left, right) {
        return left.anyOf.every((schema) => Visit(schema, right) === TypeExtendsResult.True) ? TypeExtendsResult.True : TypeExtendsResult.False;
      }
      function UnknownRight(left, right) {
        return TypeExtendsResult.True;
      }
      function Unknown(left, right) {
        if (TypeGuard.TIntersect(right))
          return IntersectRight(left, right);
        if (TypeGuard.TUnion(right))
          return UnionRight(left, right);
        if (TypeGuard.TAny(right))
          return AnyRight(left, right);
        if (TypeGuard.TString(right))
          return StringRight(left, right);
        if (TypeGuard.TNumber(right))
          return NumberRight(left, right);
        if (TypeGuard.TInteger(right))
          return IntegerRight(left, right);
        if (TypeGuard.TBoolean(right))
          return BooleanRight(left, right);
        if (TypeGuard.TArray(right))
          return ArrayRight(left, right);
        if (TypeGuard.TTuple(right))
          return TupleRight(left, right);
        if (TypeGuard.TObject(right))
          return ObjectRight(left, right);
        return TypeGuard.TUnknown(right) ? TypeExtendsResult.True : TypeExtendsResult.False;
      }
      function VoidRight(left, right) {
        if (TypeGuard.TUndefined(left))
          return TypeExtendsResult.True;
        return TypeGuard.TUndefined(left) ? TypeExtendsResult.True : TypeExtendsResult.False;
      }
      function Void(left, right) {
        if (TypeGuard.TIntersect(right))
          return IntersectRight(left, right);
        if (TypeGuard.TUnion(right))
          return UnionRight(left, right);
        if (TypeGuard.TUnknown(right))
          return UnknownRight(left, right);
        if (TypeGuard.TAny(right))
          return AnyRight(left, right);
        if (TypeGuard.TObject(right))
          return ObjectRight(left, right);
        return TypeGuard.TVoid(right) ? TypeExtendsResult.True : TypeExtendsResult.False;
      }
      function Visit(left, right) {
        if (TypeGuard.TTemplateLiteral(left))
          return Visit(TemplateLiteralResolver.Resolve(left), right);
        if (TypeGuard.TTemplateLiteral(right))
          return Visit(left, TemplateLiteralResolver.Resolve(right));
        if (TypeGuard.TAny(left))
          return Any(left, right);
        if (TypeGuard.TArray(left))
          return Array2(left, right);
        if (TypeGuard.TBigInt(left))
          return BigInt(left, right);
        if (TypeGuard.TBoolean(left))
          return Boolean2(left, right);
        if (TypeGuard.TConstructor(left))
          return Constructor(left, right);
        if (TypeGuard.TDate(left))
          return Date2(left, right);
        if (TypeGuard.TFunction(left))
          return Function(left, right);
        if (TypeGuard.TInteger(left))
          return Integer(left, right);
        if (TypeGuard.TIntersect(left))
          return Intersect(left, right);
        if (TypeGuard.TLiteral(left))
          return Literal(left, right);
        if (TypeGuard.TNever(left))
          return Never(left, right);
        if (TypeGuard.TNull(left))
          return Null(left, right);
        if (TypeGuard.TNumber(left))
          return Number2(left, right);
        if (TypeGuard.TObject(left))
          return Object2(left, right);
        if (TypeGuard.TRecord(left))
          return Record(left, right);
        if (TypeGuard.TString(left))
          return String2(left, right);
        if (TypeGuard.TSymbol(left))
          return Symbol2(left, right);
        if (TypeGuard.TTuple(left))
          return Tuple(left, right);
        if (TypeGuard.TPromise(left))
          return Promise2(left, right);
        if (TypeGuard.TUint8Array(left))
          return Uint8Array2(left, right);
        if (TypeGuard.TUndefined(left))
          return Undefined(left, right);
        if (TypeGuard.TUnion(left))
          return Union(left, right);
        if (TypeGuard.TUnknown(left))
          return Unknown(left, right);
        if (TypeGuard.TVoid(left))
          return Void(left, right);
        throw Error(`TypeExtends: Unknown left type operand '${left[exports2.Kind]}'`);
      }
      function Extends(left, right) {
        return Visit(left, right);
      }
      TypeExtends2.Extends = Extends;
    })(TypeExtends = exports2.TypeExtends || (exports2.TypeExtends = {}));
    var TypeClone;
    (function(TypeClone2) {
      function IsObject(value) {
        return typeof value === "object" && value !== null;
      }
      function IsArray(value) {
        return globalThis.Array.isArray(value);
      }
      function Array2(value) {
        return value.map((value2) => Visit(value2));
      }
      function Object2(value) {
        const clonedProperties = globalThis.Object.getOwnPropertyNames(value).reduce((acc, key) => {
          return { ...acc, [key]: Visit(value[key]) };
        }, {});
        const clonedSymbols = globalThis.Object.getOwnPropertySymbols(value).reduce((acc, key) => {
          return { ...acc, [key]: Visit(value[key]) };
        }, {});
        return { ...clonedProperties, ...clonedSymbols };
      }
      function Visit(value) {
        if (IsArray(value))
          return Array2(value);
        if (IsObject(value))
          return Object2(value);
        return value;
      }
      function Clone(schema, options) {
        return { ...Visit(schema), ...options };
      }
      TypeClone2.Clone = Clone;
    })(TypeClone = exports2.TypeClone || (exports2.TypeClone = {}));
    var ObjectMap;
    (function(ObjectMap2) {
      function Intersect(schema, callback) {
        return exports2.Type.Intersect(schema.allOf.map((inner) => Visit(inner, callback)), { ...schema });
      }
      function Union(schema, callback) {
        return exports2.Type.Union(schema.anyOf.map((inner) => Visit(inner, callback)), { ...schema });
      }
      function Object2(schema, callback) {
        return callback(schema);
      }
      function Visit(schema, callback) {
        if (schema[exports2.Kind] === "Intersect")
          return Intersect(schema, callback);
        if (schema[exports2.Kind] === "Union")
          return Union(schema, callback);
        if (schema[exports2.Kind] === "Object")
          return Object2(schema, callback);
        return schema;
      }
      function Map2(schema, callback, options) {
        return { ...Visit(TypeClone.Clone(schema, {}), callback), ...options };
      }
      ObjectMap2.Map = Map2;
    })(ObjectMap = exports2.ObjectMap || (exports2.ObjectMap = {}));
    var KeyResolver;
    (function(KeyResolver2) {
      function IsKeyable(schema) {
        return TypeGuard.TIntersect(schema) || TypeGuard.TUnion(schema) || TypeGuard.TObject(schema) && globalThis.Object.getOwnPropertyNames(schema.properties).length > 0;
      }
      function Intersect(schema) {
        return [...schema.allOf.filter((schema2) => IsKeyable(schema2)).reduce((set, schema2) => Visit(schema2).map((key) => set.add(key))[0], /* @__PURE__ */ new Set())];
      }
      function Union(schema) {
        const sets = schema.anyOf.filter((schema2) => IsKeyable(schema2)).map((inner) => Visit(inner));
        return [...sets.reduce((set, outer) => outer.map((key) => sets.every((inner) => inner.includes(key)) ? set.add(key) : set)[0], /* @__PURE__ */ new Set())];
      }
      function Object2(schema) {
        return globalThis.Object.keys(schema.properties);
      }
      function Visit(schema) {
        if (TypeGuard.TIntersect(schema))
          return Intersect(schema);
        if (TypeGuard.TUnion(schema))
          return Union(schema);
        if (TypeGuard.TObject(schema))
          return Object2(schema);
        return [];
      }
      function Resolve(schema) {
        return Visit(schema);
      }
      KeyResolver2.Resolve = Resolve;
    })(KeyResolver = exports2.KeyResolver || (exports2.KeyResolver = {}));
    var TemplateLiteralPattern;
    (function(TemplateLiteralPattern2) {
      function Escape(value) {
        return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      }
      function Visit(schema, acc) {
        if (TypeGuard.TTemplateLiteral(schema)) {
          const pattern = schema.pattern.slice(1, schema.pattern.length - 1);
          return pattern;
        } else if (TypeGuard.TUnion(schema)) {
          const tokens = schema.anyOf.map((schema2) => Visit(schema2, acc)).join("|");
          return `(${tokens})`;
        } else if (TypeGuard.TNumber(schema)) {
          return `${acc}${exports2.PatternNumber}`;
        } else if (TypeGuard.TInteger(schema)) {
          return `${acc}${exports2.PatternNumber}`;
        } else if (TypeGuard.TBigInt(schema)) {
          return `${acc}${exports2.PatternNumber}`;
        } else if (TypeGuard.TString(schema)) {
          return `${acc}${exports2.PatternString}`;
        } else if (TypeGuard.TLiteral(schema)) {
          return `${acc}${Escape(schema.const.toString())}`;
        } else if (TypeGuard.TBoolean(schema)) {
          return `${acc}${exports2.PatternBoolean}`;
        } else if (TypeGuard.TNever(schema)) {
          throw Error("TemplateLiteralPattern: TemplateLiteral cannot operate on types of TNever");
        } else {
          throw Error(`TemplateLiteralPattern: Unexpected Kind '${schema[exports2.Kind]}'`);
        }
      }
      function Create(kinds) {
        return `^${kinds.map((schema) => Visit(schema, "")).join("")}$`;
      }
      TemplateLiteralPattern2.Create = Create;
    })(TemplateLiteralPattern = exports2.TemplateLiteralPattern || (exports2.TemplateLiteralPattern = {}));
    var TemplateLiteralResolver;
    (function(TemplateLiteralResolver2) {
      function Resolve(template) {
        const expression = TemplateLiteralParser.ParseExact(template.pattern);
        if (!TemplateLiteralFinite.Check(expression))
          return exports2.Type.String();
        const literals = [...TemplateLiteralGenerator.Generate(expression)].map((value) => exports2.Type.Literal(value));
        return exports2.Type.Union(literals);
      }
      TemplateLiteralResolver2.Resolve = Resolve;
    })(TemplateLiteralResolver = exports2.TemplateLiteralResolver || (exports2.TemplateLiteralResolver = {}));
    var TemplateLiteralParserError = class extends Error {
      constructor(message) {
        super(message);
      }
    };
    exports2.TemplateLiteralParserError = TemplateLiteralParserError;
    var TemplateLiteralParser;
    (function(TemplateLiteralParser2) {
      function IsNonEscaped(pattern, index, char) {
        return pattern[index] === char && pattern.charCodeAt(index - 1) !== 92;
      }
      function IsOpenParen(pattern, index) {
        return IsNonEscaped(pattern, index, "(");
      }
      function IsCloseParen(pattern, index) {
        return IsNonEscaped(pattern, index, ")");
      }
      function IsSeparator(pattern, index) {
        return IsNonEscaped(pattern, index, "|");
      }
      function IsGroup(pattern) {
        if (!(IsOpenParen(pattern, 0) && IsCloseParen(pattern, pattern.length - 1)))
          return false;
        let count = 0;
        for (let index = 0; index < pattern.length; index++) {
          if (IsOpenParen(pattern, index))
            count += 1;
          if (IsCloseParen(pattern, index))
            count -= 1;
          if (count === 0 && index !== pattern.length - 1)
            return false;
        }
        return true;
      }
      function InGroup(pattern) {
        return pattern.slice(1, pattern.length - 1);
      }
      function IsPrecedenceOr(pattern) {
        let count = 0;
        for (let index = 0; index < pattern.length; index++) {
          if (IsOpenParen(pattern, index))
            count += 1;
          if (IsCloseParen(pattern, index))
            count -= 1;
          if (IsSeparator(pattern, index) && count === 0)
            return true;
        }
        return false;
      }
      function IsPrecedenceAnd(pattern) {
        for (let index = 0; index < pattern.length; index++) {
          if (IsOpenParen(pattern, index))
            return true;
        }
        return false;
      }
      function Or(pattern) {
        let [count, start] = [0, 0];
        const expressions = [];
        for (let index = 0; index < pattern.length; index++) {
          if (IsOpenParen(pattern, index))
            count += 1;
          if (IsCloseParen(pattern, index))
            count -= 1;
          if (IsSeparator(pattern, index) && count === 0) {
            const range2 = pattern.slice(start, index);
            if (range2.length > 0)
              expressions.push(Parse(range2));
            start = index + 1;
          }
        }
        const range = pattern.slice(start);
        if (range.length > 0)
          expressions.push(Parse(range));
        if (expressions.length === 0)
          return { type: "const", const: "" };
        if (expressions.length === 1)
          return expressions[0];
        return { type: "or", expr: expressions };
      }
      function And(pattern) {
        function Group(value, index) {
          if (!IsOpenParen(value, index))
            throw new TemplateLiteralParserError(`TemplateLiteralParser: Index must point to open parens`);
          let count = 0;
          for (let scan = index; scan < value.length; scan++) {
            if (IsOpenParen(value, scan))
              count += 1;
            if (IsCloseParen(value, scan))
              count -= 1;
            if (count === 0)
              return [index, scan];
          }
          throw new TemplateLiteralParserError(`TemplateLiteralParser: Unclosed group parens in expression`);
        }
        function Range(pattern2, index) {
          for (let scan = index; scan < pattern2.length; scan++) {
            if (IsOpenParen(pattern2, scan))
              return [index, scan];
          }
          return [index, pattern2.length];
        }
        const expressions = [];
        for (let index = 0; index < pattern.length; index++) {
          if (IsOpenParen(pattern, index)) {
            const [start, end] = Group(pattern, index);
            const range = pattern.slice(start, end + 1);
            expressions.push(Parse(range));
            index = end;
          } else {
            const [start, end] = Range(pattern, index);
            const range = pattern.slice(start, end);
            if (range.length > 0)
              expressions.push(Parse(range));
            index = end - 1;
          }
        }
        if (expressions.length === 0)
          return { type: "const", const: "" };
        if (expressions.length === 1)
          return expressions[0];
        return { type: "and", expr: expressions };
      }
      function Parse(pattern) {
        if (IsGroup(pattern))
          return Parse(InGroup(pattern));
        if (IsPrecedenceOr(pattern))
          return Or(pattern);
        if (IsPrecedenceAnd(pattern))
          return And(pattern);
        return { type: "const", const: pattern };
      }
      TemplateLiteralParser2.Parse = Parse;
      function ParseExact(pattern) {
        return Parse(pattern.slice(1, pattern.length - 1));
      }
      TemplateLiteralParser2.ParseExact = ParseExact;
    })(TemplateLiteralParser = exports2.TemplateLiteralParser || (exports2.TemplateLiteralParser = {}));
    var TemplateLiteralFinite;
    (function(TemplateLiteralFinite2) {
      function IsNumber(expression) {
        return expression.type === "or" && expression.expr.length === 2 && expression.expr[0].type === "const" && expression.expr[0].const === "0" && expression.expr[1].type === "const" && expression.expr[1].const === "[1-9][0-9]*";
      }
      function IsBoolean(expression) {
        return expression.type === "or" && expression.expr.length === 2 && expression.expr[0].type === "const" && expression.expr[0].const === "true" && expression.expr[1].type === "const" && expression.expr[1].const === "false";
      }
      function IsString(expression) {
        return expression.type === "const" && expression.const === ".*";
      }
      function Check(expression) {
        if (IsBoolean(expression))
          return true;
        if (IsNumber(expression) || IsString(expression))
          return false;
        if (expression.type === "and")
          return expression.expr.every((expr) => Check(expr));
        if (expression.type === "or")
          return expression.expr.every((expr) => Check(expr));
        if (expression.type === "const")
          return true;
        throw Error(`TemplateLiteralFinite: Unknown expression type`);
      }
      TemplateLiteralFinite2.Check = Check;
    })(TemplateLiteralFinite = exports2.TemplateLiteralFinite || (exports2.TemplateLiteralFinite = {}));
    var TemplateLiteralGenerator;
    (function(TemplateLiteralGenerator2) {
      function* Reduce(buffer) {
        if (buffer.length === 1)
          return yield* buffer[0];
        for (const left of buffer[0]) {
          for (const right of Reduce(buffer.slice(1))) {
            yield `${left}${right}`;
          }
        }
      }
      function* And(expression) {
        return yield* Reduce(expression.expr.map((expr) => [...Generate(expr)]));
      }
      function* Or(expression) {
        for (const expr of expression.expr)
          yield* Generate(expr);
      }
      function* Const(expression) {
        return yield expression.const;
      }
      function* Generate(expression) {
        if (expression.type === "and")
          return yield* And(expression);
        if (expression.type === "or")
          return yield* Or(expression);
        if (expression.type === "const")
          return yield* Const(expression);
        throw Error("TemplateLiteralGenerator: Unknown expression");
      }
      TemplateLiteralGenerator2.Generate = Generate;
    })(TemplateLiteralGenerator = exports2.TemplateLiteralGenerator || (exports2.TemplateLiteralGenerator = {}));
    var TypeOrdinal = 0;
    var TypeBuilder = class {
      /** `[Utility]` Creates a schema without `static` and `params` types */
      Create(schema) {
        return schema;
      }
      /** `[Standard]` Omits compositing symbols from this schema */
      Strict(schema) {
        return JSON.parse(JSON.stringify(schema));
      }
    };
    exports2.TypeBuilder = TypeBuilder;
    var StandardTypeBuilder = class extends TypeBuilder {
      // ------------------------------------------------------------------------
      // Modifiers
      // ------------------------------------------------------------------------
      /** `[Modifier]` Creates a Optional property */
      Optional(schema) {
        return { [exports2.Modifier]: "Optional", ...TypeClone.Clone(schema, {}) };
      }
      /** `[Modifier]` Creates a ReadonlyOptional property */
      ReadonlyOptional(schema) {
        return { [exports2.Modifier]: "ReadonlyOptional", ...TypeClone.Clone(schema, {}) };
      }
      /** `[Modifier]` Creates a Readonly object or property */
      Readonly(schema) {
        return { [exports2.Modifier]: "Readonly", ...schema };
      }
      // ------------------------------------------------------------------------
      // Types
      // ------------------------------------------------------------------------
      /** `[Standard]` Creates an Any type */
      Any(options = {}) {
        return this.Create({ ...options, [exports2.Kind]: "Any" });
      }
      /** `[Standard]` Creates an Array type */
      Array(items, options = {}) {
        return this.Create({ ...options, [exports2.Kind]: "Array", type: "array", items: TypeClone.Clone(items, {}) });
      }
      /** `[Standard]` Creates a Boolean type */
      Boolean(options = {}) {
        return this.Create({ ...options, [exports2.Kind]: "Boolean", type: "boolean" });
      }
      /** `[Standard]` Creates a Composite object type. */
      Composite(objects, options) {
        const isOptionalAll = (objects2, key) => objects2.every((object) => !(key in object.properties) || IsOptional(object.properties[key]));
        const IsOptional = (schema) => TypeGuard.TOptional(schema) || TypeGuard.TReadonlyOptional(schema);
        const [required, optional] = [/* @__PURE__ */ new Set(), /* @__PURE__ */ new Set()];
        for (const object of objects) {
          for (const key of globalThis.Object.getOwnPropertyNames(object.properties)) {
            if (isOptionalAll(objects, key))
              optional.add(key);
          }
        }
        for (const object of objects) {
          for (const key of globalThis.Object.getOwnPropertyNames(object.properties)) {
            if (!optional.has(key))
              required.add(key);
          }
        }
        const properties = {};
        for (const object of objects) {
          for (const [key, schema] of Object.entries(object.properties)) {
            const property = TypeClone.Clone(schema, {});
            if (!optional.has(key))
              delete property[exports2.Modifier];
            if (key in properties) {
              const left = TypeExtends.Extends(properties[key], property) !== TypeExtendsResult.False;
              const right = TypeExtends.Extends(property, properties[key]) !== TypeExtendsResult.False;
              if (!left && !right)
                properties[key] = exports2.Type.Never();
              if (!left && right)
                properties[key] = property;
            } else {
              properties[key] = property;
            }
          }
        }
        if (required.size > 0) {
          return this.Create({ ...options, [exports2.Kind]: "Object", [exports2.Hint]: "Composite", type: "object", properties, required: [...required] });
        } else {
          return this.Create({ ...options, [exports2.Kind]: "Object", [exports2.Hint]: "Composite", type: "object", properties });
        }
      }
      /** `[Standard]` Creates a Enum type */
      Enum(item, options = {}) {
        const values = globalThis.Object.keys(item).filter((key) => isNaN(key)).map((key) => item[key]);
        const anyOf = values.map((value) => typeof value === "string" ? { [exports2.Kind]: "Literal", type: "string", const: value } : { [exports2.Kind]: "Literal", type: "number", const: value });
        return this.Create({ ...options, [exports2.Kind]: "Union", anyOf });
      }
      /** `[Standard]` A conditional type expression that will return the true type if the left type extends the right */
      Extends(left, right, trueType, falseType, options = {}) {
        switch (TypeExtends.Extends(left, right)) {
          case TypeExtendsResult.Union:
            return this.Union([TypeClone.Clone(trueType, options), TypeClone.Clone(falseType, options)]);
          case TypeExtendsResult.True:
            return TypeClone.Clone(trueType, options);
          case TypeExtendsResult.False:
            return TypeClone.Clone(falseType, options);
        }
      }
      /** `[Standard]` Excludes from the left type any type that is not assignable to the right */
      Exclude(left, right, options = {}) {
        if (TypeGuard.TTemplateLiteral(left))
          return this.Exclude(TemplateLiteralResolver.Resolve(left), right, options);
        if (TypeGuard.TTemplateLiteral(right))
          return this.Exclude(left, TemplateLiteralResolver.Resolve(right), options);
        if (TypeGuard.TUnion(left)) {
          const narrowed = left.anyOf.filter((inner) => TypeExtends.Extends(inner, right) === TypeExtendsResult.False);
          return narrowed.length === 1 ? TypeClone.Clone(narrowed[0], options) : this.Union(narrowed, options);
        } else {
          return TypeExtends.Extends(left, right) !== TypeExtendsResult.False ? this.Never(options) : TypeClone.Clone(left, options);
        }
      }
      /** `[Standard]` Extracts from the left type any type that is assignable to the right */
      Extract(left, right, options = {}) {
        if (TypeGuard.TTemplateLiteral(left))
          return this.Extract(TemplateLiteralResolver.Resolve(left), right, options);
        if (TypeGuard.TTemplateLiteral(right))
          return this.Extract(left, TemplateLiteralResolver.Resolve(right), options);
        if (TypeGuard.TUnion(left)) {
          const narrowed = left.anyOf.filter((inner) => TypeExtends.Extends(inner, right) !== TypeExtendsResult.False);
          return narrowed.length === 1 ? TypeClone.Clone(narrowed[0], options) : this.Union(narrowed, options);
        } else {
          return TypeExtends.Extends(left, right) !== TypeExtendsResult.False ? TypeClone.Clone(left, options) : this.Never(options);
        }
      }
      /** `[Standard]` Creates an Integer type */
      Integer(options = {}) {
        return this.Create({ ...options, [exports2.Kind]: "Integer", type: "integer" });
      }
      Intersect(allOf, options = {}) {
        if (allOf.length === 0)
          return exports2.Type.Never();
        if (allOf.length === 1)
          return TypeClone.Clone(allOf[0], options);
        const objects = allOf.every((schema) => TypeGuard.TObject(schema));
        const cloned = allOf.map((schema) => TypeClone.Clone(schema, {}));
        const clonedUnevaluatedProperties = TypeGuard.TSchema(options.unevaluatedProperties) ? { unevaluatedProperties: TypeClone.Clone(options.unevaluatedProperties, {}) } : {};
        if (options.unevaluatedProperties === false || TypeGuard.TSchema(options.unevaluatedProperties) || objects) {
          return this.Create({ ...options, ...clonedUnevaluatedProperties, [exports2.Kind]: "Intersect", type: "object", allOf: cloned });
        } else {
          return this.Create({ ...options, ...clonedUnevaluatedProperties, [exports2.Kind]: "Intersect", allOf: cloned });
        }
      }
      /** `[Standard]` Creates a KeyOf type */
      KeyOf(schema, options = {}) {
        if (TypeGuard.TRecord(schema)) {
          const pattern = Object.getOwnPropertyNames(schema.patternProperties)[0];
          if (pattern === exports2.PatternNumberExact)
            return this.Number(options);
          if (pattern === exports2.PatternStringExact)
            return this.String(options);
          throw Error("StandardTypeBuilder: Unable to resolve key type from Record key pattern");
        } else {
          const resolved = KeyResolver.Resolve(schema);
          if (resolved.length === 0)
            return this.Never(options);
          const literals = resolved.map((key) => this.Literal(key));
          return this.Union(literals, options);
        }
      }
      /** `[Standard]` Creates a Literal type */
      Literal(value, options = {}) {
        return this.Create({ ...options, [exports2.Kind]: "Literal", const: value, type: typeof value });
      }
      /** `[Standard]` Creates a Never type */
      Never(options = {}) {
        return this.Create({ ...options, [exports2.Kind]: "Never", not: {} });
      }
      /** `[Standard]` Creates a Not type. The first argument is the disallowed type, the second is the allowed. */
      Not(not, schema, options) {
        return this.Create({ ...options, [exports2.Kind]: "Not", allOf: [{ not: TypeClone.Clone(not, {}) }, TypeClone.Clone(schema, {})] });
      }
      /** `[Standard]` Creates a Null type */
      Null(options = {}) {
        return this.Create({ ...options, [exports2.Kind]: "Null", type: "null" });
      }
      /** `[Standard]` Creates a Number type */
      Number(options = {}) {
        return this.Create({ ...options, [exports2.Kind]: "Number", type: "number" });
      }
      /** `[Standard]` Creates an Object type */
      Object(properties, options = {}) {
        const propertyKeys = globalThis.Object.getOwnPropertyNames(properties);
        const optionalKeys = propertyKeys.filter((key) => TypeGuard.TOptional(properties[key]) || TypeGuard.TReadonlyOptional(properties[key]));
        const requiredKeys = propertyKeys.filter((name) => !optionalKeys.includes(name));
        const clonedAdditionalProperties = TypeGuard.TSchema(options.additionalProperties) ? { additionalProperties: TypeClone.Clone(options.additionalProperties, {}) } : {};
        const clonedProperties = propertyKeys.reduce((acc, key) => ({ ...acc, [key]: TypeClone.Clone(properties[key], {}) }), {});
        if (requiredKeys.length > 0) {
          return this.Create({ ...options, ...clonedAdditionalProperties, [exports2.Kind]: "Object", type: "object", properties: clonedProperties, required: requiredKeys });
        } else {
          return this.Create({ ...options, ...clonedAdditionalProperties, [exports2.Kind]: "Object", type: "object", properties: clonedProperties });
        }
      }
      Omit(schema, unresolved, options = {}) {
        const keys = TypeGuard.TUnionLiteral(unresolved) ? unresolved.anyOf.map((schema2) => schema2.const) : TypeGuard.TLiteral(unresolved) ? [unresolved.const] : TypeGuard.TNever(unresolved) ? [] : unresolved;
        return ObjectMap.Map(TypeClone.Clone(schema, {}), (schema2) => {
          if (schema2.required) {
            schema2.required = schema2.required.filter((key) => !keys.includes(key));
            if (schema2.required.length === 0)
              delete schema2.required;
          }
          for (const key of globalThis.Object.keys(schema2.properties)) {
            if (keys.includes(key))
              delete schema2.properties[key];
          }
          return this.Create(schema2);
        }, options);
      }
      /** `[Standard]` Creates a mapped type where all properties are Optional */
      Partial(schema, options = {}) {
        function Apply(schema2) {
          switch (schema2[exports2.Modifier]) {
            case "ReadonlyOptional":
              schema2[exports2.Modifier] = "ReadonlyOptional";
              break;
            case "Readonly":
              schema2[exports2.Modifier] = "ReadonlyOptional";
              break;
            case "Optional":
              schema2[exports2.Modifier] = "Optional";
              break;
            default:
              schema2[exports2.Modifier] = "Optional";
              break;
          }
        }
        return ObjectMap.Map(TypeClone.Clone(schema, {}), (schema2) => {
          delete schema2.required;
          globalThis.Object.keys(schema2.properties).forEach((key) => Apply(schema2.properties[key]));
          return schema2;
        }, options);
      }
      Pick(schema, unresolved, options = {}) {
        const keys = TypeGuard.TUnionLiteral(unresolved) ? unresolved.anyOf.map((schema2) => schema2.const) : TypeGuard.TLiteral(unresolved) ? [unresolved.const] : TypeGuard.TNever(unresolved) ? [] : unresolved;
        return ObjectMap.Map(TypeClone.Clone(schema, {}), (schema2) => {
          if (schema2.required) {
            schema2.required = schema2.required.filter((key) => keys.includes(key));
            if (schema2.required.length === 0)
              delete schema2.required;
          }
          for (const key of globalThis.Object.keys(schema2.properties)) {
            if (!keys.includes(key))
              delete schema2.properties[key];
          }
          return this.Create(schema2);
        }, options);
      }
      /** `[Standard]` Creates a Record type */
      Record(key, schema, options = {}) {
        if (TypeGuard.TTemplateLiteral(key)) {
          const expression = TemplateLiteralParser.ParseExact(key.pattern);
          return TemplateLiteralFinite.Check(expression) ? this.Object([...TemplateLiteralGenerator.Generate(expression)].reduce((acc, key2) => ({ ...acc, [key2]: TypeClone.Clone(schema, {}) }), {}), options) : this.Create({ ...options, [exports2.Kind]: "Record", type: "object", patternProperties: { [key.pattern]: TypeClone.Clone(schema, {}) }, additionalProperties: false });
        } else if (TypeGuard.TUnionLiteral(key)) {
          if (key.anyOf.every((schema2) => TypeGuard.TLiteral(schema2) && (typeof schema2.const === "string" || typeof schema2.const === "number"))) {
            const properties = key.anyOf.reduce((acc, literal) => ({ ...acc, [literal.const]: TypeClone.Clone(schema, {}) }), {});
            return this.Object(properties, { ...options, [exports2.Hint]: "Record" });
          } else
            throw Error("TypeBuilder: Record key can only be derived from union literal of number or string");
        } else if (TypeGuard.TLiteral(key)) {
          if (typeof key.const === "string" || typeof key.const === "number") {
            return this.Object({ [key.const]: TypeClone.Clone(schema, {}) }, options);
          } else
            throw Error("TypeBuilder: Record key can only be derived from literals of number or string");
        } else if (TypeGuard.TInteger(key) || TypeGuard.TNumber(key)) {
          const pattern = exports2.PatternNumberExact;
          return this.Create({ ...options, [exports2.Kind]: "Record", type: "object", patternProperties: { [pattern]: TypeClone.Clone(schema, {}) }, additionalProperties: false });
        } else if (TypeGuard.TString(key)) {
          const pattern = key.pattern === void 0 ? exports2.PatternStringExact : key.pattern;
          return this.Create({ ...options, [exports2.Kind]: "Record", type: "object", patternProperties: { [pattern]: TypeClone.Clone(schema, {}) }, additionalProperties: false });
        } else {
          throw Error(`StandardTypeBuilder: Invalid Record Key`);
        }
      }
      /** `[Standard]` Creates a Recursive type */
      Recursive(callback, options = {}) {
        if (options.$id === void 0)
          options.$id = `T${TypeOrdinal++}`;
        const thisType = callback({ [exports2.Kind]: "This", $ref: `${options.$id}` });
        thisType.$id = options.$id;
        return this.Create({ ...options, [exports2.Hint]: "Recursive", ...thisType });
      }
      /** `[Standard]` Creates a Ref type. The referenced type must contain a $id */
      Ref(schema, options = {}) {
        if (schema.$id === void 0)
          throw Error("StandardTypeBuilder.Ref: Target type must specify an $id");
        return this.Create({ ...options, [exports2.Kind]: "Ref", $ref: schema.$id });
      }
      /** `[Standard]` Creates a mapped type where all properties are Required */
      Required(schema, options = {}) {
        function Apply(schema2) {
          switch (schema2[exports2.Modifier]) {
            case "ReadonlyOptional":
              schema2[exports2.Modifier] = "Readonly";
              break;
            case "Readonly":
              schema2[exports2.Modifier] = "Readonly";
              break;
            case "Optional":
              delete schema2[exports2.Modifier];
              break;
            default:
              delete schema2[exports2.Modifier];
              break;
          }
        }
        return ObjectMap.Map(TypeClone.Clone(schema, {}), (schema2) => {
          schema2.required = globalThis.Object.keys(schema2.properties);
          globalThis.Object.keys(schema2.properties).forEach((key) => Apply(schema2.properties[key]));
          return schema2;
        }, options);
      }
      /** `[Standard]` Creates a String type */
      String(options = {}) {
        return this.Create({ ...options, [exports2.Kind]: "String", type: "string" });
      }
      /** `[Standard]` Creates a template literal type */
      TemplateLiteral(kinds, options = {}) {
        const pattern = TemplateLiteralPattern.Create(kinds);
        return this.Create({ ...options, [exports2.Kind]: "TemplateLiteral", type: "string", pattern });
      }
      /** `[Standard]` Creates a Tuple type */
      Tuple(items, options = {}) {
        const [additionalItems, minItems, maxItems] = [false, items.length, items.length];
        const clonedItems = items.map((item) => TypeClone.Clone(item, {}));
        const schema = items.length > 0 ? { ...options, [exports2.Kind]: "Tuple", type: "array", items: clonedItems, additionalItems, minItems, maxItems } : { ...options, [exports2.Kind]: "Tuple", type: "array", minItems, maxItems };
        return this.Create(schema);
      }
      Union(union, options = {}) {
        if (TypeGuard.TTemplateLiteral(union)) {
          return TemplateLiteralResolver.Resolve(union);
        } else {
          const anyOf = union;
          if (anyOf.length === 0)
            return this.Never(options);
          if (anyOf.length === 1)
            return this.Create(TypeClone.Clone(anyOf[0], options));
          const clonedAnyOf = anyOf.map((schema) => TypeClone.Clone(schema, {}));
          return this.Create({ ...options, [exports2.Kind]: "Union", anyOf: clonedAnyOf });
        }
      }
      /** `[Standard]` Creates an Unknown type */
      Unknown(options = {}) {
        return this.Create({ ...options, [exports2.Kind]: "Unknown" });
      }
      /** `[Standard]` Creates a Unsafe type that infers for the generic argument */
      Unsafe(options = {}) {
        return this.Create({ ...options, [exports2.Kind]: options[exports2.Kind] || "Unsafe" });
      }
    };
    exports2.StandardTypeBuilder = StandardTypeBuilder;
    var ExtendedTypeBuilder = class extends StandardTypeBuilder {
      /** `[Extended]` Creates a BigInt type */
      BigInt(options = {}) {
        return this.Create({ ...options, [exports2.Kind]: "BigInt", type: "null", typeOf: "BigInt" });
      }
      /** `[Extended]` Extracts the ConstructorParameters from the given Constructor type */
      ConstructorParameters(schema, options = {}) {
        return this.Tuple([...schema.parameters], { ...options });
      }
      Constructor(parameters, returns, options = {}) {
        const clonedReturns = TypeClone.Clone(returns, {});
        if (TypeGuard.TTuple(parameters)) {
          const clonedParameters = parameters.items === void 0 ? [] : parameters.items.map((parameter) => TypeClone.Clone(parameter, {}));
          return this.Create({ ...options, [exports2.Kind]: "Constructor", type: "object", instanceOf: "Constructor", parameters: clonedParameters, returns: clonedReturns });
        } else if (globalThis.Array.isArray(parameters)) {
          const clonedParameters = parameters.map((parameter) => TypeClone.Clone(parameter, {}));
          return this.Create({ ...options, [exports2.Kind]: "Constructor", type: "object", instanceOf: "Constructor", parameters: clonedParameters, returns: clonedReturns });
        } else {
          throw new Error("ExtendedTypeBuilder.Constructor: Invalid parameters");
        }
      }
      /** `[Extended]` Creates a Date type */
      Date(options = {}) {
        return this.Create({ ...options, [exports2.Kind]: "Date", type: "object", instanceOf: "Date" });
      }
      Function(parameters, returns, options = {}) {
        const clonedReturns = TypeClone.Clone(returns, {});
        if (TypeGuard.TTuple(parameters)) {
          const clonedParameters = parameters.items === void 0 ? [] : parameters.items.map((parameter) => TypeClone.Clone(parameter, {}));
          return this.Create({ ...options, [exports2.Kind]: "Function", type: "object", instanceOf: "Function", parameters: clonedParameters, returns: clonedReturns });
        } else if (globalThis.Array.isArray(parameters)) {
          const clonedParameters = parameters.map((parameter) => TypeClone.Clone(parameter, {}));
          return this.Create({ ...options, [exports2.Kind]: "Function", type: "object", instanceOf: "Function", parameters: clonedParameters, returns: clonedReturns });
        } else {
          throw new Error("ExtendedTypeBuilder.Function: Invalid parameters");
        }
      }
      /** `[Extended]` Extracts the InstanceType from the given Constructor */
      InstanceType(schema, options = {}) {
        return TypeClone.Clone(schema.returns, options);
      }
      /** `[Extended]` Extracts the Parameters from the given Function type */
      Parameters(schema, options = {}) {
        return this.Tuple(schema.parameters, { ...options });
      }
      /** `[Extended]` Creates a Promise type */
      Promise(item, options = {}) {
        return this.Create({ ...options, [exports2.Kind]: "Promise", type: "object", instanceOf: "Promise", item: TypeClone.Clone(item, {}) });
      }
      /** `[Extended]` Creates a regular expression type */
      RegEx(regex, options = {}) {
        return this.Create({ ...options, [exports2.Kind]: "String", type: "string", pattern: regex.source });
      }
      /** `[Extended]` Extracts the ReturnType from the given Function */
      ReturnType(schema, options = {}) {
        return TypeClone.Clone(schema.returns, options);
      }
      /** `[Extended]` Creates a Symbol type */
      Symbol(options) {
        return this.Create({ ...options, [exports2.Kind]: "Symbol", type: "null", typeOf: "Symbol" });
      }
      /** `[Extended]` Creates a Undefined type */
      Undefined(options = {}) {
        return this.Create({ ...options, [exports2.Kind]: "Undefined", type: "null", typeOf: "Undefined" });
      }
      /** `[Extended]` Creates a Uint8Array type */
      Uint8Array(options = {}) {
        return this.Create({ ...options, [exports2.Kind]: "Uint8Array", type: "object", instanceOf: "Uint8Array" });
      }
      /** `[Extended]` Creates a Void type */
      Void(options = {}) {
        return this.Create({ ...options, [exports2.Kind]: "Void", type: "null", typeOf: "Void" });
      }
    };
    exports2.ExtendedTypeBuilder = ExtendedTypeBuilder;
    exports2.StandardType = new StandardTypeBuilder();
    exports2.Type = new ExtendedTypeBuilder();
  }
});

// node_modules/@sinclair/typebox/system/system.js
var require_system = __commonJS({
  "node_modules/@sinclair/typebox/system/system.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.TypeSystem = exports2.TypeSystemDuplicateFormat = exports2.TypeSystemDuplicateTypeKind = void 0;
    var Types = require_typebox();
    var TypeSystemDuplicateTypeKind = class extends Error {
      constructor(kind) {
        super(`Duplicate type kind '${kind}' detected`);
      }
    };
    exports2.TypeSystemDuplicateTypeKind = TypeSystemDuplicateTypeKind;
    var TypeSystemDuplicateFormat = class extends Error {
      constructor(kind) {
        super(`Duplicate string format '${kind}' detected`);
      }
    };
    exports2.TypeSystemDuplicateFormat = TypeSystemDuplicateFormat;
    var TypeSystem;
    (function(TypeSystem2) {
      TypeSystem2.ExactOptionalPropertyTypes = false;
      TypeSystem2.AllowArrayObjects = false;
      TypeSystem2.AllowNaN = false;
      TypeSystem2.AllowVoidNull = false;
      function Type(kind, check) {
        if (Types.TypeRegistry.Has(kind))
          throw new TypeSystemDuplicateTypeKind(kind);
        Types.TypeRegistry.Set(kind, check);
        return (options = {}) => Types.Type.Unsafe({ ...options, [Types.Kind]: kind });
      }
      TypeSystem2.Type = Type;
      function Format(format, check) {
        if (Types.FormatRegistry.Has(format))
          throw new TypeSystemDuplicateFormat(format);
        Types.FormatRegistry.Set(format, check);
        return format;
      }
      TypeSystem2.Format = Format;
      function CreateType(kind, check) {
        return Type(kind, check);
      }
      TypeSystem2.CreateType = CreateType;
      function CreateFormat(format, check) {
        return Format(format, check);
      }
      TypeSystem2.CreateFormat = CreateFormat;
    })(TypeSystem = exports2.TypeSystem || (exports2.TypeSystem = {}));
  }
});

// node_modules/@sinclair/typebox/system/index.js
var require_system2 = __commonJS({
  "node_modules/@sinclair/typebox/system/index.js"(exports2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __exportStar = exports2 && exports2.__exportStar || function(m, exports3) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports3, p)) __createBinding(exports3, m, p);
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    __exportStar(require_system(), exports2);
  }
});

// node_modules/@sinclair/typebox/value/hash.js
var require_hash = __commonJS({
  "node_modules/@sinclair/typebox/value/hash.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.ValueHash = exports2.ValueHashError = void 0;
    var ValueHashError = class extends Error {
      constructor(value) {
        super(`Hash: Unable to hash value`);
        this.value = value;
      }
    };
    exports2.ValueHashError = ValueHashError;
    var ValueHash;
    (function(ValueHash2) {
      let ByteMarker;
      (function(ByteMarker2) {
        ByteMarker2[ByteMarker2["Undefined"] = 0] = "Undefined";
        ByteMarker2[ByteMarker2["Null"] = 1] = "Null";
        ByteMarker2[ByteMarker2["Boolean"] = 2] = "Boolean";
        ByteMarker2[ByteMarker2["Number"] = 3] = "Number";
        ByteMarker2[ByteMarker2["String"] = 4] = "String";
        ByteMarker2[ByteMarker2["Object"] = 5] = "Object";
        ByteMarker2[ByteMarker2["Array"] = 6] = "Array";
        ByteMarker2[ByteMarker2["Date"] = 7] = "Date";
        ByteMarker2[ByteMarker2["Uint8Array"] = 8] = "Uint8Array";
        ByteMarker2[ByteMarker2["Symbol"] = 9] = "Symbol";
        ByteMarker2[ByteMarker2["BigInt"] = 10] = "BigInt";
      })(ByteMarker || (ByteMarker = {}));
      let Hash = globalThis.BigInt("14695981039346656037");
      const [Prime, Size] = [globalThis.BigInt("1099511628211"), globalThis.BigInt("2") ** globalThis.BigInt("64")];
      const Bytes = globalThis.Array.from({ length: 256 }).map((_, i) => globalThis.BigInt(i));
      const F64 = new globalThis.Float64Array(1);
      const F64In = new globalThis.DataView(F64.buffer);
      const F64Out = new globalThis.Uint8Array(F64.buffer);
      function IsDate(value) {
        return value instanceof globalThis.Date;
      }
      function IsUint8Array(value) {
        return value instanceof globalThis.Uint8Array;
      }
      function IsArray(value) {
        return globalThis.Array.isArray(value);
      }
      function IsBoolean(value) {
        return typeof value === "boolean";
      }
      function IsNull(value) {
        return value === null;
      }
      function IsNumber(value) {
        return typeof value === "number";
      }
      function IsSymbol(value) {
        return typeof value === "symbol";
      }
      function IsBigInt(value) {
        return typeof value === "bigint";
      }
      function IsObject(value) {
        return typeof value === "object" && value !== null && !IsArray(value) && !IsDate(value) && !IsUint8Array(value);
      }
      function IsString(value) {
        return typeof value === "string";
      }
      function IsUndefined(value) {
        return value === void 0;
      }
      function Array2(value) {
        FNV1A64(ByteMarker.Array);
        for (const item of value) {
          Visit(item);
        }
      }
      function Boolean2(value) {
        FNV1A64(ByteMarker.Boolean);
        FNV1A64(value ? 1 : 0);
      }
      function BigInt(value) {
        FNV1A64(ByteMarker.BigInt);
        F64In.setBigInt64(0, value);
        for (const byte of F64Out) {
          FNV1A64(byte);
        }
      }
      function Date2(value) {
        FNV1A64(ByteMarker.Date);
        Visit(value.getTime());
      }
      function Null(value) {
        FNV1A64(ByteMarker.Null);
      }
      function Number2(value) {
        FNV1A64(ByteMarker.Number);
        F64In.setFloat64(0, value);
        for (const byte of F64Out) {
          FNV1A64(byte);
        }
      }
      function Object2(value) {
        FNV1A64(ByteMarker.Object);
        for (const key of globalThis.Object.keys(value).sort()) {
          Visit(key);
          Visit(value[key]);
        }
      }
      function String2(value) {
        FNV1A64(ByteMarker.String);
        for (let i = 0; i < value.length; i++) {
          FNV1A64(value.charCodeAt(i));
        }
      }
      function Symbol2(value) {
        FNV1A64(ByteMarker.Symbol);
        Visit(value.description);
      }
      function Uint8Array2(value) {
        FNV1A64(ByteMarker.Uint8Array);
        for (let i = 0; i < value.length; i++) {
          FNV1A64(value[i]);
        }
      }
      function Undefined(value) {
        return FNV1A64(ByteMarker.Undefined);
      }
      function Visit(value) {
        if (IsArray(value)) {
          Array2(value);
        } else if (IsBoolean(value)) {
          Boolean2(value);
        } else if (IsBigInt(value)) {
          BigInt(value);
        } else if (IsDate(value)) {
          Date2(value);
        } else if (IsNull(value)) {
          Null(value);
        } else if (IsNumber(value)) {
          Number2(value);
        } else if (IsObject(value)) {
          Object2(value);
        } else if (IsString(value)) {
          String2(value);
        } else if (IsSymbol(value)) {
          Symbol2(value);
        } else if (IsUint8Array(value)) {
          Uint8Array2(value);
        } else if (IsUndefined(value)) {
          Undefined(value);
        } else {
          throw new ValueHashError(value);
        }
      }
      function FNV1A64(byte) {
        Hash = Hash ^ Bytes[byte];
        Hash = Hash * Prime % Size;
      }
      function Create(value) {
        Hash = globalThis.BigInt("14695981039346656037");
        Visit(value);
        return Hash;
      }
      ValueHash2.Create = Create;
    })(ValueHash = exports2.ValueHash || (exports2.ValueHash = {}));
  }
});

// node_modules/@sinclair/typebox/errors/errors.js
var require_errors = __commonJS({
  "node_modules/@sinclair/typebox/errors/errors.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.ValueErrors = exports2.ValueErrorsDereferenceError = exports2.ValueErrorsUnknownTypeError = exports2.ValueErrorIterator = exports2.ValueErrorType = void 0;
    var Types = require_typebox();
    var index_1 = require_system2();
    var hash_1 = require_hash();
    var ValueErrorType;
    (function(ValueErrorType2) {
      ValueErrorType2[ValueErrorType2["Array"] = 0] = "Array";
      ValueErrorType2[ValueErrorType2["ArrayMinItems"] = 1] = "ArrayMinItems";
      ValueErrorType2[ValueErrorType2["ArrayMaxItems"] = 2] = "ArrayMaxItems";
      ValueErrorType2[ValueErrorType2["ArrayUniqueItems"] = 3] = "ArrayUniqueItems";
      ValueErrorType2[ValueErrorType2["BigInt"] = 4] = "BigInt";
      ValueErrorType2[ValueErrorType2["BigIntMultipleOf"] = 5] = "BigIntMultipleOf";
      ValueErrorType2[ValueErrorType2["BigIntExclusiveMinimum"] = 6] = "BigIntExclusiveMinimum";
      ValueErrorType2[ValueErrorType2["BigIntExclusiveMaximum"] = 7] = "BigIntExclusiveMaximum";
      ValueErrorType2[ValueErrorType2["BigIntMinimum"] = 8] = "BigIntMinimum";
      ValueErrorType2[ValueErrorType2["BigIntMaximum"] = 9] = "BigIntMaximum";
      ValueErrorType2[ValueErrorType2["Boolean"] = 10] = "Boolean";
      ValueErrorType2[ValueErrorType2["Date"] = 11] = "Date";
      ValueErrorType2[ValueErrorType2["DateExclusiveMinimumTimestamp"] = 12] = "DateExclusiveMinimumTimestamp";
      ValueErrorType2[ValueErrorType2["DateExclusiveMaximumTimestamp"] = 13] = "DateExclusiveMaximumTimestamp";
      ValueErrorType2[ValueErrorType2["DateMinimumTimestamp"] = 14] = "DateMinimumTimestamp";
      ValueErrorType2[ValueErrorType2["DateMaximumTimestamp"] = 15] = "DateMaximumTimestamp";
      ValueErrorType2[ValueErrorType2["Function"] = 16] = "Function";
      ValueErrorType2[ValueErrorType2["Integer"] = 17] = "Integer";
      ValueErrorType2[ValueErrorType2["IntegerMultipleOf"] = 18] = "IntegerMultipleOf";
      ValueErrorType2[ValueErrorType2["IntegerExclusiveMinimum"] = 19] = "IntegerExclusiveMinimum";
      ValueErrorType2[ValueErrorType2["IntegerExclusiveMaximum"] = 20] = "IntegerExclusiveMaximum";
      ValueErrorType2[ValueErrorType2["IntegerMinimum"] = 21] = "IntegerMinimum";
      ValueErrorType2[ValueErrorType2["IntegerMaximum"] = 22] = "IntegerMaximum";
      ValueErrorType2[ValueErrorType2["Intersect"] = 23] = "Intersect";
      ValueErrorType2[ValueErrorType2["IntersectUnevaluatedProperties"] = 24] = "IntersectUnevaluatedProperties";
      ValueErrorType2[ValueErrorType2["Literal"] = 25] = "Literal";
      ValueErrorType2[ValueErrorType2["Never"] = 26] = "Never";
      ValueErrorType2[ValueErrorType2["Not"] = 27] = "Not";
      ValueErrorType2[ValueErrorType2["Null"] = 28] = "Null";
      ValueErrorType2[ValueErrorType2["Number"] = 29] = "Number";
      ValueErrorType2[ValueErrorType2["NumberMultipleOf"] = 30] = "NumberMultipleOf";
      ValueErrorType2[ValueErrorType2["NumberExclusiveMinimum"] = 31] = "NumberExclusiveMinimum";
      ValueErrorType2[ValueErrorType2["NumberExclusiveMaximum"] = 32] = "NumberExclusiveMaximum";
      ValueErrorType2[ValueErrorType2["NumberMinumum"] = 33] = "NumberMinumum";
      ValueErrorType2[ValueErrorType2["NumberMaximum"] = 34] = "NumberMaximum";
      ValueErrorType2[ValueErrorType2["Object"] = 35] = "Object";
      ValueErrorType2[ValueErrorType2["ObjectMinProperties"] = 36] = "ObjectMinProperties";
      ValueErrorType2[ValueErrorType2["ObjectMaxProperties"] = 37] = "ObjectMaxProperties";
      ValueErrorType2[ValueErrorType2["ObjectAdditionalProperties"] = 38] = "ObjectAdditionalProperties";
      ValueErrorType2[ValueErrorType2["ObjectRequiredProperties"] = 39] = "ObjectRequiredProperties";
      ValueErrorType2[ValueErrorType2["Promise"] = 40] = "Promise";
      ValueErrorType2[ValueErrorType2["RecordKeyNumeric"] = 41] = "RecordKeyNumeric";
      ValueErrorType2[ValueErrorType2["RecordKeyString"] = 42] = "RecordKeyString";
      ValueErrorType2[ValueErrorType2["String"] = 43] = "String";
      ValueErrorType2[ValueErrorType2["StringMinLength"] = 44] = "StringMinLength";
      ValueErrorType2[ValueErrorType2["StringMaxLength"] = 45] = "StringMaxLength";
      ValueErrorType2[ValueErrorType2["StringPattern"] = 46] = "StringPattern";
      ValueErrorType2[ValueErrorType2["StringFormatUnknown"] = 47] = "StringFormatUnknown";
      ValueErrorType2[ValueErrorType2["StringFormat"] = 48] = "StringFormat";
      ValueErrorType2[ValueErrorType2["Symbol"] = 49] = "Symbol";
      ValueErrorType2[ValueErrorType2["TupleZeroLength"] = 50] = "TupleZeroLength";
      ValueErrorType2[ValueErrorType2["TupleLength"] = 51] = "TupleLength";
      ValueErrorType2[ValueErrorType2["Undefined"] = 52] = "Undefined";
      ValueErrorType2[ValueErrorType2["Union"] = 53] = "Union";
      ValueErrorType2[ValueErrorType2["Uint8Array"] = 54] = "Uint8Array";
      ValueErrorType2[ValueErrorType2["Uint8ArrayMinByteLength"] = 55] = "Uint8ArrayMinByteLength";
      ValueErrorType2[ValueErrorType2["Uint8ArrayMaxByteLength"] = 56] = "Uint8ArrayMaxByteLength";
      ValueErrorType2[ValueErrorType2["Void"] = 57] = "Void";
      ValueErrorType2[ValueErrorType2["Custom"] = 58] = "Custom";
    })(ValueErrorType = exports2.ValueErrorType || (exports2.ValueErrorType = {}));
    var ValueErrorIterator = class {
      constructor(iterator) {
        this.iterator = iterator;
      }
      [Symbol.iterator]() {
        return this.iterator;
      }
      /** Returns the first value error or undefined if no errors */
      First() {
        const next = this.iterator.next();
        return next.done ? void 0 : next.value;
      }
    };
    exports2.ValueErrorIterator = ValueErrorIterator;
    var ValueErrorsUnknownTypeError = class extends Error {
      constructor(schema) {
        super("ValueErrors: Unknown type");
        this.schema = schema;
      }
    };
    exports2.ValueErrorsUnknownTypeError = ValueErrorsUnknownTypeError;
    var ValueErrorsDereferenceError = class extends Error {
      constructor(schema) {
        super(`ValueErrors: Unable to dereference schema with $id '${schema.$ref}'`);
        this.schema = schema;
      }
    };
    exports2.ValueErrorsDereferenceError = ValueErrorsDereferenceError;
    var ValueErrors;
    (function(ValueErrors2) {
      function IsBigInt(value) {
        return typeof value === "bigint";
      }
      function IsInteger(value) {
        return globalThis.Number.isInteger(value);
      }
      function IsString(value) {
        return typeof value === "string";
      }
      function IsDefined(value) {
        return value !== void 0;
      }
      function IsExactOptionalProperty(value, key) {
        return index_1.TypeSystem.ExactOptionalPropertyTypes ? key in value : value[key] !== void 0;
      }
      function IsObject(value) {
        const result = typeof value === "object" && value !== null;
        return index_1.TypeSystem.AllowArrayObjects ? result : result && !globalThis.Array.isArray(value);
      }
      function IsRecordObject(value) {
        return IsObject(value) && !(value instanceof globalThis.Date) && !(value instanceof globalThis.Uint8Array);
      }
      function IsNumber(value) {
        const result = typeof value === "number";
        return index_1.TypeSystem.AllowNaN ? result : result && globalThis.Number.isFinite(value);
      }
      function IsVoid(value) {
        const result = value === void 0;
        return index_1.TypeSystem.AllowVoidNull ? result || value === null : result;
      }
      function* Any(schema, references, path3, value) {
      }
      function* Array2(schema, references, path3, value) {
        if (!globalThis.Array.isArray(value)) {
          return yield { type: ValueErrorType.Array, schema, path: path3, value, message: `Expected array` };
        }
        if (IsDefined(schema.minItems) && !(value.length >= schema.minItems)) {
          yield { type: ValueErrorType.ArrayMinItems, schema, path: path3, value, message: `Expected array length to be greater or equal to ${schema.minItems}` };
        }
        if (IsDefined(schema.maxItems) && !(value.length <= schema.maxItems)) {
          yield { type: ValueErrorType.ArrayMinItems, schema, path: path3, value, message: `Expected array length to be less or equal to ${schema.maxItems}` };
        }
        if (schema.uniqueItems === true && !(function() {
          const set = /* @__PURE__ */ new Set();
          for (const element of value) {
            const hashed = hash_1.ValueHash.Create(element);
            if (set.has(hashed)) {
              return false;
            } else {
              set.add(hashed);
            }
          }
          return true;
        })()) {
          yield { type: ValueErrorType.ArrayUniqueItems, schema, path: path3, value, message: `Expected array elements to be unique` };
        }
        for (let i = 0; i < value.length; i++) {
          yield* Visit(schema.items, references, `${path3}/${i}`, value[i]);
        }
      }
      function* BigInt(schema, references, path3, value) {
        if (!IsBigInt(value)) {
          return yield { type: ValueErrorType.BigInt, schema, path: path3, value, message: `Expected bigint` };
        }
        if (IsDefined(schema.multipleOf) && !(value % schema.multipleOf === globalThis.BigInt(0))) {
          yield { type: ValueErrorType.BigIntMultipleOf, schema, path: path3, value, message: `Expected bigint to be a multiple of ${schema.multipleOf}` };
        }
        if (IsDefined(schema.exclusiveMinimum) && !(value > schema.exclusiveMinimum)) {
          yield { type: ValueErrorType.BigIntExclusiveMinimum, schema, path: path3, value, message: `Expected bigint to be greater than ${schema.exclusiveMinimum}` };
        }
        if (IsDefined(schema.exclusiveMaximum) && !(value < schema.exclusiveMaximum)) {
          yield { type: ValueErrorType.BigIntExclusiveMaximum, schema, path: path3, value, message: `Expected bigint to be less than ${schema.exclusiveMaximum}` };
        }
        if (IsDefined(schema.minimum) && !(value >= schema.minimum)) {
          yield { type: ValueErrorType.BigIntMinimum, schema, path: path3, value, message: `Expected bigint to be greater or equal to ${schema.minimum}` };
        }
        if (IsDefined(schema.maximum) && !(value <= schema.maximum)) {
          yield { type: ValueErrorType.BigIntMaximum, schema, path: path3, value, message: `Expected bigint to be less or equal to ${schema.maximum}` };
        }
      }
      function* Boolean2(schema, references, path3, value) {
        if (!(typeof value === "boolean")) {
          return yield { type: ValueErrorType.Boolean, schema, path: path3, value, message: `Expected boolean` };
        }
      }
      function* Constructor(schema, references, path3, value) {
        yield* Visit(schema.returns, references, path3, value.prototype);
      }
      function* Date2(schema, references, path3, value) {
        if (!(value instanceof globalThis.Date)) {
          return yield { type: ValueErrorType.Date, schema, path: path3, value, message: `Expected Date object` };
        }
        if (!globalThis.isFinite(value.getTime())) {
          return yield { type: ValueErrorType.Date, schema, path: path3, value, message: `Invalid Date` };
        }
        if (IsDefined(schema.exclusiveMinimumTimestamp) && !(value.getTime() > schema.exclusiveMinimumTimestamp)) {
          yield { type: ValueErrorType.DateExclusiveMinimumTimestamp, schema, path: path3, value, message: `Expected Date timestamp to be greater than ${schema.exclusiveMinimum}` };
        }
        if (IsDefined(schema.exclusiveMaximumTimestamp) && !(value.getTime() < schema.exclusiveMaximumTimestamp)) {
          yield { type: ValueErrorType.DateExclusiveMaximumTimestamp, schema, path: path3, value, message: `Expected Date timestamp to be less than ${schema.exclusiveMaximum}` };
        }
        if (IsDefined(schema.minimumTimestamp) && !(value.getTime() >= schema.minimumTimestamp)) {
          yield { type: ValueErrorType.DateMinimumTimestamp, schema, path: path3, value, message: `Expected Date timestamp to be greater or equal to ${schema.minimum}` };
        }
        if (IsDefined(schema.maximumTimestamp) && !(value.getTime() <= schema.maximumTimestamp)) {
          yield { type: ValueErrorType.DateMaximumTimestamp, schema, path: path3, value, message: `Expected Date timestamp to be less or equal to ${schema.maximum}` };
        }
      }
      function* Function(schema, references, path3, value) {
        if (!(typeof value === "function")) {
          return yield { type: ValueErrorType.Function, schema, path: path3, value, message: `Expected function` };
        }
      }
      function* Integer(schema, references, path3, value) {
        if (!IsInteger(value)) {
          return yield { type: ValueErrorType.Integer, schema, path: path3, value, message: `Expected integer` };
        }
        if (IsDefined(schema.multipleOf) && !(value % schema.multipleOf === 0)) {
          yield { type: ValueErrorType.IntegerMultipleOf, schema, path: path3, value, message: `Expected integer to be a multiple of ${schema.multipleOf}` };
        }
        if (IsDefined(schema.exclusiveMinimum) && !(value > schema.exclusiveMinimum)) {
          yield { type: ValueErrorType.IntegerExclusiveMinimum, schema, path: path3, value, message: `Expected integer to be greater than ${schema.exclusiveMinimum}` };
        }
        if (IsDefined(schema.exclusiveMaximum) && !(value < schema.exclusiveMaximum)) {
          yield { type: ValueErrorType.IntegerExclusiveMaximum, schema, path: path3, value, message: `Expected integer to be less than ${schema.exclusiveMaximum}` };
        }
        if (IsDefined(schema.minimum) && !(value >= schema.minimum)) {
          yield { type: ValueErrorType.IntegerMinimum, schema, path: path3, value, message: `Expected integer to be greater or equal to ${schema.minimum}` };
        }
        if (IsDefined(schema.maximum) && !(value <= schema.maximum)) {
          yield { type: ValueErrorType.IntegerMaximum, schema, path: path3, value, message: `Expected integer to be less or equal to ${schema.maximum}` };
        }
      }
      function* Intersect(schema, references, path3, value) {
        for (const subschema of schema.allOf) {
          const next = Visit(subschema, references, path3, value).next();
          if (!next.done) {
            yield next.value;
            yield { type: ValueErrorType.Intersect, schema, path: path3, value, message: `Expected all sub schemas to be valid` };
            return;
          }
        }
        if (schema.unevaluatedProperties === false) {
          const schemaKeys = Types.KeyResolver.Resolve(schema);
          const valueKeys = globalThis.Object.getOwnPropertyNames(value);
          for (const valueKey of valueKeys) {
            if (!schemaKeys.includes(valueKey)) {
              yield { type: ValueErrorType.IntersectUnevaluatedProperties, schema, path: `${path3}/${valueKey}`, value, message: `Unexpected property` };
            }
          }
        }
        if (typeof schema.unevaluatedProperties === "object") {
          const schemaKeys = Types.KeyResolver.Resolve(schema);
          const valueKeys = globalThis.Object.getOwnPropertyNames(value);
          for (const valueKey of valueKeys) {
            if (!schemaKeys.includes(valueKey)) {
              const next = Visit(schema.unevaluatedProperties, references, `${path3}/${valueKey}`, value[valueKey]).next();
              if (!next.done) {
                yield next.value;
                yield { type: ValueErrorType.IntersectUnevaluatedProperties, schema, path: `${path3}/${valueKey}`, value, message: `Invalid additional property` };
                return;
              }
            }
          }
        }
      }
      function* Literal(schema, references, path3, value) {
        if (!(value === schema.const)) {
          const error = typeof schema.const === "string" ? `'${schema.const}'` : schema.const;
          return yield { type: ValueErrorType.Literal, schema, path: path3, value, message: `Expected ${error}` };
        }
      }
      function* Never(schema, references, path3, value) {
        yield { type: ValueErrorType.Never, schema, path: path3, value, message: `Value cannot be validated` };
      }
      function* Not(schema, references, path3, value) {
        if (Visit(schema.allOf[0].not, references, path3, value).next().done === true) {
          yield { type: ValueErrorType.Not, schema, path: path3, value, message: `Value should not validate` };
        }
        yield* Visit(schema.allOf[1], references, path3, value);
      }
      function* Null(schema, references, path3, value) {
        if (!(value === null)) {
          return yield { type: ValueErrorType.Null, schema, path: path3, value, message: `Expected null` };
        }
      }
      function* Number2(schema, references, path3, value) {
        if (!IsNumber(value)) {
          return yield { type: ValueErrorType.Number, schema, path: path3, value, message: `Expected number` };
        }
        if (IsDefined(schema.multipleOf) && !(value % schema.multipleOf === 0)) {
          yield { type: ValueErrorType.NumberMultipleOf, schema, path: path3, value, message: `Expected number to be a multiple of ${schema.multipleOf}` };
        }
        if (IsDefined(schema.exclusiveMinimum) && !(value > schema.exclusiveMinimum)) {
          yield { type: ValueErrorType.NumberExclusiveMinimum, schema, path: path3, value, message: `Expected number to be greater than ${schema.exclusiveMinimum}` };
        }
        if (IsDefined(schema.exclusiveMaximum) && !(value < schema.exclusiveMaximum)) {
          yield { type: ValueErrorType.NumberExclusiveMaximum, schema, path: path3, value, message: `Expected number to be less than ${schema.exclusiveMaximum}` };
        }
        if (IsDefined(schema.minimum) && !(value >= schema.minimum)) {
          yield { type: ValueErrorType.NumberMaximum, schema, path: path3, value, message: `Expected number to be greater or equal to ${schema.minimum}` };
        }
        if (IsDefined(schema.maximum) && !(value <= schema.maximum)) {
          yield { type: ValueErrorType.NumberMinumum, schema, path: path3, value, message: `Expected number to be less or equal to ${schema.maximum}` };
        }
      }
      function* Object2(schema, references, path3, value) {
        if (!IsObject(value)) {
          return yield { type: ValueErrorType.Object, schema, path: path3, value, message: `Expected object` };
        }
        if (IsDefined(schema.minProperties) && !(globalThis.Object.getOwnPropertyNames(value).length >= schema.minProperties)) {
          yield { type: ValueErrorType.ObjectMinProperties, schema, path: path3, value, message: `Expected object to have at least ${schema.minProperties} properties` };
        }
        if (IsDefined(schema.maxProperties) && !(globalThis.Object.getOwnPropertyNames(value).length <= schema.maxProperties)) {
          yield { type: ValueErrorType.ObjectMaxProperties, schema, path: path3, value, message: `Expected object to have less than ${schema.minProperties} properties` };
        }
        const requiredKeys = globalThis.Array.isArray(schema.required) ? schema.required : [];
        const knownKeys = globalThis.Object.getOwnPropertyNames(schema.properties);
        const unknownKeys = globalThis.Object.getOwnPropertyNames(value);
        for (const knownKey of knownKeys) {
          const property = schema.properties[knownKey];
          if (schema.required && schema.required.includes(knownKey)) {
            yield* Visit(property, references, `${path3}/${knownKey}`, value[knownKey]);
            if (Types.ExtendsUndefined.Check(schema) && !(knownKey in value)) {
              yield { type: ValueErrorType.ObjectRequiredProperties, schema: property, path: `${path3}/${knownKey}`, value: void 0, message: `Expected required property` };
            }
          } else {
            if (IsExactOptionalProperty(value, knownKey)) {
              yield* Visit(property, references, `${path3}/${knownKey}`, value[knownKey]);
            }
          }
        }
        for (const requiredKey of requiredKeys) {
          if (unknownKeys.includes(requiredKey))
            continue;
          yield { type: ValueErrorType.ObjectRequiredProperties, schema: schema.properties[requiredKey], path: `${path3}/${requiredKey}`, value: void 0, message: `Expected required property` };
        }
        if (schema.additionalProperties === false) {
          for (const valueKey of unknownKeys) {
            if (!knownKeys.includes(valueKey)) {
              yield { type: ValueErrorType.ObjectAdditionalProperties, schema, path: `${path3}/${valueKey}`, value: value[valueKey], message: `Unexpected property` };
            }
          }
        }
        if (typeof schema.additionalProperties === "object") {
          for (const valueKey of unknownKeys) {
            if (knownKeys.includes(valueKey))
              continue;
            yield* Visit(schema.additionalProperties, references, `${path3}/${valueKey}`, value[valueKey]);
          }
        }
      }
      function* Promise2(schema, references, path3, value) {
        if (!(typeof value === "object" && typeof value.then === "function")) {
          yield { type: ValueErrorType.Promise, schema, path: path3, value, message: `Expected Promise` };
        }
      }
      function* Record(schema, references, path3, value) {
        if (!IsRecordObject(value)) {
          return yield { type: ValueErrorType.Object, schema, path: path3, value, message: `Expected record object` };
        }
        if (IsDefined(schema.minProperties) && !(globalThis.Object.getOwnPropertyNames(value).length >= schema.minProperties)) {
          yield { type: ValueErrorType.ObjectMinProperties, schema, path: path3, value, message: `Expected object to have at least ${schema.minProperties} properties` };
        }
        if (IsDefined(schema.maxProperties) && !(globalThis.Object.getOwnPropertyNames(value).length <= schema.maxProperties)) {
          yield { type: ValueErrorType.ObjectMaxProperties, schema, path: path3, value, message: `Expected object to have less than ${schema.minProperties} properties` };
        }
        const [keyPattern, valueSchema] = globalThis.Object.entries(schema.patternProperties)[0];
        const regex = new RegExp(keyPattern);
        if (!globalThis.Object.getOwnPropertyNames(value).every((key) => regex.test(key))) {
          const numeric = keyPattern === Types.PatternNumberExact;
          const type = numeric ? ValueErrorType.RecordKeyNumeric : ValueErrorType.RecordKeyString;
          const message = numeric ? "Expected all object property keys to be numeric" : "Expected all object property keys to be strings";
          return yield { type, schema, path: path3, value, message };
        }
        for (const [propKey, propValue] of globalThis.Object.entries(value)) {
          yield* Visit(valueSchema, references, `${path3}/${propKey}`, propValue);
        }
      }
      function* Ref(schema, references, path3, value) {
        const index = references.findIndex((foreign) => foreign.$id === schema.$ref);
        if (index === -1)
          throw new ValueErrorsDereferenceError(schema);
        const target = references[index];
        yield* Visit(target, references, path3, value);
      }
      function* String2(schema, references, path3, value) {
        if (!IsString(value)) {
          return yield { type: ValueErrorType.String, schema, path: path3, value, message: "Expected string" };
        }
        if (IsDefined(schema.minLength) && !(value.length >= schema.minLength)) {
          yield { type: ValueErrorType.StringMinLength, schema, path: path3, value, message: `Expected string length greater or equal to ${schema.minLength}` };
        }
        if (IsDefined(schema.maxLength) && !(value.length <= schema.maxLength)) {
          yield { type: ValueErrorType.StringMaxLength, schema, path: path3, value, message: `Expected string length less or equal to ${schema.maxLength}` };
        }
        if (schema.pattern !== void 0) {
          const regex = new RegExp(schema.pattern);
          if (!regex.test(value)) {
            yield { type: ValueErrorType.StringPattern, schema, path: path3, value, message: `Expected string to match pattern ${schema.pattern}` };
          }
        }
        if (schema.format !== void 0) {
          if (!Types.FormatRegistry.Has(schema.format)) {
            yield { type: ValueErrorType.StringFormatUnknown, schema, path: path3, value, message: `Unknown string format '${schema.format}'` };
          } else {
            const format = Types.FormatRegistry.Get(schema.format);
            if (!format(value)) {
              yield { type: ValueErrorType.StringFormat, schema, path: path3, value, message: `Expected string to match format '${schema.format}'` };
            }
          }
        }
      }
      function* Symbol2(schema, references, path3, value) {
        if (!(typeof value === "symbol")) {
          return yield { type: ValueErrorType.Symbol, schema, path: path3, value, message: "Expected symbol" };
        }
      }
      function* TemplateLiteral(schema, references, path3, value) {
        if (!IsString(value)) {
          return yield { type: ValueErrorType.String, schema, path: path3, value, message: "Expected string" };
        }
        const regex = new RegExp(schema.pattern);
        if (!regex.test(value)) {
          yield { type: ValueErrorType.StringPattern, schema, path: path3, value, message: `Expected string to match pattern ${schema.pattern}` };
        }
      }
      function* This(schema, references, path3, value) {
        const index = references.findIndex((foreign) => foreign.$id === schema.$ref);
        if (index === -1)
          throw new ValueErrorsDereferenceError(schema);
        const target = references[index];
        yield* Visit(target, references, path3, value);
      }
      function* Tuple(schema, references, path3, value) {
        if (!globalThis.Array.isArray(value)) {
          return yield { type: ValueErrorType.Array, schema, path: path3, value, message: "Expected Array" };
        }
        if (schema.items === void 0 && !(value.length === 0)) {
          return yield { type: ValueErrorType.TupleZeroLength, schema, path: path3, value, message: "Expected tuple to have 0 elements" };
        }
        if (!(value.length === schema.maxItems)) {
          yield { type: ValueErrorType.TupleLength, schema, path: path3, value, message: `Expected tuple to have ${schema.maxItems} elements` };
        }
        if (!schema.items) {
          return;
        }
        for (let i = 0; i < schema.items.length; i++) {
          yield* Visit(schema.items[i], references, `${path3}/${i}`, value[i]);
        }
      }
      function* Undefined(schema, references, path3, value) {
        if (!(value === void 0)) {
          yield { type: ValueErrorType.Undefined, schema, path: path3, value, message: `Expected undefined` };
        }
      }
      function* Union(schema, references, path3, value) {
        const errors = [];
        for (const inner of schema.anyOf) {
          const variantErrors = [...Visit(inner, references, path3, value)];
          if (variantErrors.length === 0)
            return;
          errors.push(...variantErrors);
        }
        if (errors.length > 0) {
          yield { type: ValueErrorType.Union, schema, path: path3, value, message: "Expected value of union" };
        }
        for (const error of errors) {
          yield error;
        }
      }
      function* Uint8Array2(schema, references, path3, value) {
        if (!(value instanceof globalThis.Uint8Array)) {
          return yield { type: ValueErrorType.Uint8Array, schema, path: path3, value, message: `Expected Uint8Array` };
        }
        if (IsDefined(schema.maxByteLength) && !(value.length <= schema.maxByteLength)) {
          yield { type: ValueErrorType.Uint8ArrayMaxByteLength, schema, path: path3, value, message: `Expected Uint8Array to have a byte length less or equal to ${schema.maxByteLength}` };
        }
        if (IsDefined(schema.minByteLength) && !(value.length >= schema.minByteLength)) {
          yield { type: ValueErrorType.Uint8ArrayMinByteLength, schema, path: path3, value, message: `Expected Uint8Array to have a byte length greater or equal to ${schema.maxByteLength}` };
        }
      }
      function* Unknown(schema, references, path3, value) {
      }
      function* Void(schema, references, path3, value) {
        if (!IsVoid(value)) {
          return yield { type: ValueErrorType.Void, schema, path: path3, value, message: `Expected void` };
        }
      }
      function* UserDefined(schema, references, path3, value) {
        const check = Types.TypeRegistry.Get(schema[Types.Kind]);
        if (!check(schema, value)) {
          return yield { type: ValueErrorType.Custom, schema, path: path3, value, message: `Expected kind ${schema[Types.Kind]}` };
        }
      }
      function* Visit(schema, references, path3, value) {
        const references_ = IsDefined(schema.$id) ? [...references, schema] : references;
        const schema_ = schema;
        switch (schema_[Types.Kind]) {
          case "Any":
            return yield* Any(schema_, references_, path3, value);
          case "Array":
            return yield* Array2(schema_, references_, path3, value);
          case "BigInt":
            return yield* BigInt(schema_, references_, path3, value);
          case "Boolean":
            return yield* Boolean2(schema_, references_, path3, value);
          case "Constructor":
            return yield* Constructor(schema_, references_, path3, value);
          case "Date":
            return yield* Date2(schema_, references_, path3, value);
          case "Function":
            return yield* Function(schema_, references_, path3, value);
          case "Integer":
            return yield* Integer(schema_, references_, path3, value);
          case "Intersect":
            return yield* Intersect(schema_, references_, path3, value);
          case "Literal":
            return yield* Literal(schema_, references_, path3, value);
          case "Never":
            return yield* Never(schema_, references_, path3, value);
          case "Not":
            return yield* Not(schema_, references_, path3, value);
          case "Null":
            return yield* Null(schema_, references_, path3, value);
          case "Number":
            return yield* Number2(schema_, references_, path3, value);
          case "Object":
            return yield* Object2(schema_, references_, path3, value);
          case "Promise":
            return yield* Promise2(schema_, references_, path3, value);
          case "Record":
            return yield* Record(schema_, references_, path3, value);
          case "Ref":
            return yield* Ref(schema_, references_, path3, value);
          case "String":
            return yield* String2(schema_, references_, path3, value);
          case "Symbol":
            return yield* Symbol2(schema_, references_, path3, value);
          case "TemplateLiteral":
            return yield* TemplateLiteral(schema_, references_, path3, value);
          case "This":
            return yield* This(schema_, references_, path3, value);
          case "Tuple":
            return yield* Tuple(schema_, references_, path3, value);
          case "Undefined":
            return yield* Undefined(schema_, references_, path3, value);
          case "Union":
            return yield* Union(schema_, references_, path3, value);
          case "Uint8Array":
            return yield* Uint8Array2(schema_, references_, path3, value);
          case "Unknown":
            return yield* Unknown(schema_, references_, path3, value);
          case "Void":
            return yield* Void(schema_, references_, path3, value);
          default:
            if (!Types.TypeRegistry.Has(schema_[Types.Kind]))
              throw new ValueErrorsUnknownTypeError(schema);
            return yield* UserDefined(schema_, references_, path3, value);
        }
      }
      function Errors(schema, references, value) {
        const iterator = Visit(schema, references, "", value);
        return new ValueErrorIterator(iterator);
      }
      ValueErrors2.Errors = Errors;
    })(ValueErrors = exports2.ValueErrors || (exports2.ValueErrors = {}));
  }
});

// node_modules/@sinclair/typebox/errors/index.js
var require_errors2 = __commonJS({
  "node_modules/@sinclair/typebox/errors/index.js"(exports2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __exportStar = exports2 && exports2.__exportStar || function(m, exports3) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports3, p)) __createBinding(exports3, m, p);
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    __exportStar(require_errors(), exports2);
  }
});

// node_modules/@sinclair/typebox/value/is.js
var require_is = __commonJS({
  "node_modules/@sinclair/typebox/value/is.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.Is = void 0;
    var Is;
    (function(Is2) {
      function Object2(value) {
        return value !== null && typeof value === "object" && !globalThis.Array.isArray(value) && !ArrayBuffer.isView(value) && !(value instanceof globalThis.Date);
      }
      Is2.Object = Object2;
      function Date2(value) {
        return value instanceof globalThis.Date;
      }
      Is2.Date = Date2;
      function Array2(value) {
        return globalThis.Array.isArray(value) && !ArrayBuffer.isView(value);
      }
      Is2.Array = Array2;
      function Value(value) {
        return value === null || value === void 0 || typeof value === "function" || typeof value === "symbol" || typeof value === "bigint" || typeof value === "number" || typeof value === "boolean" || typeof value === "string";
      }
      Is2.Value = Value;
      function TypedArray(value) {
        return ArrayBuffer.isView(value);
      }
      Is2.TypedArray = TypedArray;
    })(Is = exports2.Is || (exports2.Is = {}));
  }
});

// node_modules/@sinclair/typebox/value/clone.js
var require_clone = __commonJS({
  "node_modules/@sinclair/typebox/value/clone.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.ValueClone = void 0;
    var is_1 = require_is();
    var ValueClone;
    (function(ValueClone2) {
      function Array2(value) {
        return value.map((element) => Clone(element));
      }
      function Date2(value) {
        return new globalThis.Date(value.toISOString());
      }
      function Object2(value) {
        const keys = [...globalThis.Object.keys(value), ...globalThis.Object.getOwnPropertySymbols(value)];
        return keys.reduce((acc, key) => ({ ...acc, [key]: Clone(value[key]) }), {});
      }
      function TypedArray(value) {
        return value.slice();
      }
      function Value(value) {
        return value;
      }
      function Clone(value) {
        if (is_1.Is.Date(value)) {
          return Date2(value);
        } else if (is_1.Is.Object(value)) {
          return Object2(value);
        } else if (is_1.Is.Array(value)) {
          return Array2(value);
        } else if (is_1.Is.TypedArray(value)) {
          return TypedArray(value);
        } else if (is_1.Is.Value(value)) {
          return Value(value);
        } else {
          throw new Error("ValueClone: Unable to clone value");
        }
      }
      ValueClone2.Clone = Clone;
    })(ValueClone = exports2.ValueClone || (exports2.ValueClone = {}));
  }
});

// node_modules/@sinclair/typebox/value/pointer.js
var require_pointer = __commonJS({
  "node_modules/@sinclair/typebox/value/pointer.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.ValuePointer = exports2.ValuePointerRootDeleteError = exports2.ValuePointerRootSetError = void 0;
    var ValuePointerRootSetError = class extends Error {
      constructor(value, path3, update) {
        super("ValuePointer: Cannot set root value");
        this.value = value;
        this.path = path3;
        this.update = update;
      }
    };
    exports2.ValuePointerRootSetError = ValuePointerRootSetError;
    var ValuePointerRootDeleteError = class extends Error {
      constructor(value, path3) {
        super("ValuePointer: Cannot delete root value");
        this.value = value;
        this.path = path3;
      }
    };
    exports2.ValuePointerRootDeleteError = ValuePointerRootDeleteError;
    var ValuePointer;
    (function(ValuePointer2) {
      function Escape(component) {
        return component.indexOf("~") === -1 ? component : component.replace(/~1/g, "/").replace(/~0/g, "~");
      }
      function* Format(pointer) {
        if (pointer === "")
          return;
        let [start, end] = [0, 0];
        for (let i = 0; i < pointer.length; i++) {
          const char = pointer.charAt(i);
          if (char === "/") {
            if (i === 0) {
              start = i + 1;
            } else {
              end = i;
              yield Escape(pointer.slice(start, end));
              start = i + 1;
            }
          } else {
            end = i;
          }
        }
        yield Escape(pointer.slice(start));
      }
      ValuePointer2.Format = Format;
      function Set2(value, pointer, update) {
        if (pointer === "")
          throw new ValuePointerRootSetError(value, pointer, update);
        let [owner, next, key] = [null, value, ""];
        for (const component of Format(pointer)) {
          if (next[component] === void 0)
            next[component] = {};
          owner = next;
          next = next[component];
          key = component;
        }
        owner[key] = update;
      }
      ValuePointer2.Set = Set2;
      function Delete(value, pointer) {
        if (pointer === "")
          throw new ValuePointerRootDeleteError(value, pointer);
        let [owner, next, key] = [null, value, ""];
        for (const component of Format(pointer)) {
          if (next[component] === void 0 || next[component] === null)
            return;
          owner = next;
          next = next[component];
          key = component;
        }
        if (globalThis.Array.isArray(owner)) {
          const index = parseInt(key);
          owner.splice(index, 1);
        } else {
          delete owner[key];
        }
      }
      ValuePointer2.Delete = Delete;
      function Has(value, pointer) {
        if (pointer === "")
          return true;
        let [owner, next, key] = [null, value, ""];
        for (const component of Format(pointer)) {
          if (next[component] === void 0)
            return false;
          owner = next;
          next = next[component];
          key = component;
        }
        return globalThis.Object.getOwnPropertyNames(owner).includes(key);
      }
      ValuePointer2.Has = Has;
      function Get(value, pointer) {
        if (pointer === "")
          return value;
        let current = value;
        for (const component of Format(pointer)) {
          if (current[component] === void 0)
            return void 0;
          current = current[component];
        }
        return current;
      }
      ValuePointer2.Get = Get;
    })(ValuePointer = exports2.ValuePointer || (exports2.ValuePointer = {}));
  }
});

// node_modules/@sinclair/typebox/value/delta.js
var require_delta = __commonJS({
  "node_modules/@sinclair/typebox/value/delta.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.ValueDelta = exports2.ValueDeltaUnableToDiffUnknownValue = exports2.ValueDeltaObjectWithSymbolKeyError = exports2.Edit = exports2.Delete = exports2.Update = exports2.Insert = void 0;
    var typebox_1 = require_typebox();
    var is_1 = require_is();
    var clone_1 = require_clone();
    var pointer_1 = require_pointer();
    exports2.Insert = typebox_1.Type.Object({
      type: typebox_1.Type.Literal("insert"),
      path: typebox_1.Type.String(),
      value: typebox_1.Type.Unknown()
    });
    exports2.Update = typebox_1.Type.Object({
      type: typebox_1.Type.Literal("update"),
      path: typebox_1.Type.String(),
      value: typebox_1.Type.Unknown()
    });
    exports2.Delete = typebox_1.Type.Object({
      type: typebox_1.Type.Literal("delete"),
      path: typebox_1.Type.String()
    });
    exports2.Edit = typebox_1.Type.Union([exports2.Insert, exports2.Update, exports2.Delete]);
    var ValueDeltaObjectWithSymbolKeyError = class extends Error {
      constructor(key) {
        super("ValueDelta: Cannot diff objects with symbol keys");
        this.key = key;
      }
    };
    exports2.ValueDeltaObjectWithSymbolKeyError = ValueDeltaObjectWithSymbolKeyError;
    var ValueDeltaUnableToDiffUnknownValue = class extends Error {
      constructor(value) {
        super("ValueDelta: Unable to create diff edits for unknown value");
        this.value = value;
      }
    };
    exports2.ValueDeltaUnableToDiffUnknownValue = ValueDeltaUnableToDiffUnknownValue;
    var ValueDelta;
    (function(ValueDelta2) {
      function Update(path3, value) {
        return { type: "update", path: path3, value };
      }
      function Insert(path3, value) {
        return { type: "insert", path: path3, value };
      }
      function Delete(path3) {
        return { type: "delete", path: path3 };
      }
      function* Object2(path3, current, next) {
        if (!is_1.Is.Object(next))
          return yield Update(path3, next);
        const currentKeys = [...globalThis.Object.keys(current), ...globalThis.Object.getOwnPropertySymbols(current)];
        const nextKeys = [...globalThis.Object.keys(next), ...globalThis.Object.getOwnPropertySymbols(next)];
        for (const key of currentKeys) {
          if (typeof key === "symbol")
            throw new ValueDeltaObjectWithSymbolKeyError(key);
          if (next[key] === void 0 && nextKeys.includes(key))
            yield Update(`${path3}/${String(key)}`, void 0);
        }
        for (const key of nextKeys) {
          if (current[key] === void 0 || next[key] === void 0)
            continue;
          if (typeof key === "symbol")
            throw new ValueDeltaObjectWithSymbolKeyError(key);
          yield* Visit(`${path3}/${String(key)}`, current[key], next[key]);
        }
        for (const key of nextKeys) {
          if (typeof key === "symbol")
            throw new ValueDeltaObjectWithSymbolKeyError(key);
          if (current[key] === void 0)
            yield Insert(`${path3}/${String(key)}`, next[key]);
        }
        for (const key of currentKeys.reverse()) {
          if (typeof key === "symbol")
            throw new ValueDeltaObjectWithSymbolKeyError(key);
          if (next[key] === void 0 && !nextKeys.includes(key))
            yield Delete(`${path3}/${String(key)}`);
        }
      }
      function* Array2(path3, current, next) {
        if (!is_1.Is.Array(next))
          return yield Update(path3, next);
        for (let i = 0; i < Math.min(current.length, next.length); i++) {
          yield* Visit(`${path3}/${i}`, current[i], next[i]);
        }
        for (let i = 0; i < next.length; i++) {
          if (i < current.length)
            continue;
          yield Insert(`${path3}/${i}`, next[i]);
        }
        for (let i = current.length - 1; i >= 0; i--) {
          if (i < next.length)
            continue;
          yield Delete(`${path3}/${i}`);
        }
      }
      function* TypedArray(path3, current, next) {
        if (!is_1.Is.TypedArray(next) || current.length !== next.length || globalThis.Object.getPrototypeOf(current).constructor.name !== globalThis.Object.getPrototypeOf(next).constructor.name)
          return yield Update(path3, next);
        for (let i = 0; i < Math.min(current.length, next.length); i++) {
          yield* Visit(`${path3}/${i}`, current[i], next[i]);
        }
      }
      function* Value(path3, current, next) {
        if (current === next)
          return;
        yield Update(path3, next);
      }
      function* Visit(path3, current, next) {
        if (is_1.Is.Object(current)) {
          return yield* Object2(path3, current, next);
        } else if (is_1.Is.Array(current)) {
          return yield* Array2(path3, current, next);
        } else if (is_1.Is.TypedArray(current)) {
          return yield* TypedArray(path3, current, next);
        } else if (is_1.Is.Value(current)) {
          return yield* Value(path3, current, next);
        } else {
          throw new ValueDeltaUnableToDiffUnknownValue(current);
        }
      }
      function Diff(current, next) {
        return [...Visit("", current, next)];
      }
      ValueDelta2.Diff = Diff;
      function IsRootUpdate(edits) {
        return edits.length > 0 && edits[0].path === "" && edits[0].type === "update";
      }
      function IsIdentity(edits) {
        return edits.length === 0;
      }
      function Patch(current, edits) {
        if (IsRootUpdate(edits)) {
          return clone_1.ValueClone.Clone(edits[0].value);
        }
        if (IsIdentity(edits)) {
          return clone_1.ValueClone.Clone(current);
        }
        const clone = clone_1.ValueClone.Clone(current);
        for (const edit of edits) {
          switch (edit.type) {
            case "insert": {
              pointer_1.ValuePointer.Set(clone, edit.path, edit.value);
              break;
            }
            case "update": {
              pointer_1.ValuePointer.Set(clone, edit.path, edit.value);
              break;
            }
            case "delete": {
              pointer_1.ValuePointer.Delete(clone, edit.path);
              break;
            }
          }
        }
        return clone;
      }
      ValueDelta2.Patch = Patch;
    })(ValueDelta = exports2.ValueDelta || (exports2.ValueDelta = {}));
  }
});

// node_modules/@sinclair/typebox/value/mutate.js
var require_mutate = __commonJS({
  "node_modules/@sinclair/typebox/value/mutate.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.ValueMutate = exports2.ValueMutateInvalidRootMutationError = exports2.ValueMutateTypeMismatchError = void 0;
    var is_1 = require_is();
    var pointer_1 = require_pointer();
    var clone_1 = require_clone();
    var ValueMutateTypeMismatchError = class extends Error {
      constructor() {
        super("ValueMutate: Cannot assign due type mismatch of assignable values");
      }
    };
    exports2.ValueMutateTypeMismatchError = ValueMutateTypeMismatchError;
    var ValueMutateInvalidRootMutationError = class extends Error {
      constructor() {
        super("ValueMutate: Only object and array types can be mutated at the root level");
      }
    };
    exports2.ValueMutateInvalidRootMutationError = ValueMutateInvalidRootMutationError;
    var ValueMutate;
    (function(ValueMutate2) {
      function Object2(root, path3, current, next) {
        if (!is_1.Is.Object(current)) {
          pointer_1.ValuePointer.Set(root, path3, clone_1.ValueClone.Clone(next));
        } else {
          const currentKeys = globalThis.Object.keys(current);
          const nextKeys = globalThis.Object.keys(next);
          for (const currentKey of currentKeys) {
            if (!nextKeys.includes(currentKey)) {
              delete current[currentKey];
            }
          }
          for (const nextKey of nextKeys) {
            if (!currentKeys.includes(nextKey)) {
              current[nextKey] = null;
            }
          }
          for (const nextKey of nextKeys) {
            Visit(root, `${path3}/${nextKey}`, current[nextKey], next[nextKey]);
          }
        }
      }
      function Array2(root, path3, current, next) {
        if (!is_1.Is.Array(current)) {
          pointer_1.ValuePointer.Set(root, path3, clone_1.ValueClone.Clone(next));
        } else {
          for (let index = 0; index < next.length; index++) {
            Visit(root, `${path3}/${index}`, current[index], next[index]);
          }
          current.splice(next.length);
        }
      }
      function TypedArray(root, path3, current, next) {
        if (is_1.Is.TypedArray(current) && current.length === next.length) {
          for (let i = 0; i < current.length; i++) {
            current[i] = next[i];
          }
        } else {
          pointer_1.ValuePointer.Set(root, path3, clone_1.ValueClone.Clone(next));
        }
      }
      function Value(root, path3, current, next) {
        if (current === next)
          return;
        pointer_1.ValuePointer.Set(root, path3, next);
      }
      function Visit(root, path3, current, next) {
        if (is_1.Is.Array(next)) {
          return Array2(root, path3, current, next);
        } else if (is_1.Is.TypedArray(next)) {
          return TypedArray(root, path3, current, next);
        } else if (is_1.Is.Object(next)) {
          return Object2(root, path3, current, next);
        } else if (is_1.Is.Value(next)) {
          return Value(root, path3, current, next);
        }
      }
      function Mutate(current, next) {
        if (is_1.Is.TypedArray(current) || is_1.Is.Value(current) || is_1.Is.TypedArray(next) || is_1.Is.Value(next)) {
          throw new ValueMutateInvalidRootMutationError();
        }
        if (is_1.Is.Object(current) && is_1.Is.Array(next) || is_1.Is.Array(current) && is_1.Is.Object(next)) {
          throw new ValueMutateTypeMismatchError();
        }
        Visit(current, "", current, next);
      }
      ValueMutate2.Mutate = Mutate;
    })(ValueMutate = exports2.ValueMutate || (exports2.ValueMutate = {}));
  }
});

// node_modules/@sinclair/typebox/value/equal.js
var require_equal = __commonJS({
  "node_modules/@sinclair/typebox/value/equal.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.ValueEqual = void 0;
    var is_1 = require_is();
    var ValueEqual;
    (function(ValueEqual2) {
      function Object2(left, right) {
        if (!is_1.Is.Object(right))
          return false;
        const leftKeys = [...globalThis.Object.keys(left), ...globalThis.Object.getOwnPropertySymbols(left)];
        const rightKeys = [...globalThis.Object.keys(right), ...globalThis.Object.getOwnPropertySymbols(right)];
        if (leftKeys.length !== rightKeys.length)
          return false;
        return leftKeys.every((key) => Equal(left[key], right[key]));
      }
      function Date2(left, right) {
        return is_1.Is.Date(right) && left.getTime() === right.getTime();
      }
      function Array2(left, right) {
        if (!is_1.Is.Array(right) || left.length !== right.length)
          return false;
        return left.every((value, index) => Equal(value, right[index]));
      }
      function TypedArray(left, right) {
        if (!is_1.Is.TypedArray(right) || left.length !== right.length || globalThis.Object.getPrototypeOf(left).constructor.name !== globalThis.Object.getPrototypeOf(right).constructor.name)
          return false;
        return left.every((value, index) => Equal(value, right[index]));
      }
      function Value(left, right) {
        return left === right;
      }
      function Equal(left, right) {
        if (is_1.Is.Object(left)) {
          return Object2(left, right);
        } else if (is_1.Is.Date(left)) {
          return Date2(left, right);
        } else if (is_1.Is.TypedArray(left)) {
          return TypedArray(left, right);
        } else if (is_1.Is.Array(left)) {
          return Array2(left, right);
        } else if (is_1.Is.Value(left)) {
          return Value(left, right);
        } else {
          throw new Error("ValueEquals: Unable to compare value");
        }
      }
      ValueEqual2.Equal = Equal;
    })(ValueEqual = exports2.ValueEqual || (exports2.ValueEqual = {}));
  }
});

// node_modules/@sinclair/typebox/value/check.js
var require_check = __commonJS({
  "node_modules/@sinclair/typebox/value/check.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.ValueCheck = exports2.ValueCheckDereferenceError = exports2.ValueCheckUnknownTypeError = void 0;
    var Types = require_typebox();
    var index_1 = require_system2();
    var hash_1 = require_hash();
    var ValueCheckUnknownTypeError = class extends Error {
      constructor(schema) {
        super(`ValueCheck: ${schema[Types.Kind] ? `Unknown type '${schema[Types.Kind]}'` : "Unknown type"}`);
        this.schema = schema;
      }
    };
    exports2.ValueCheckUnknownTypeError = ValueCheckUnknownTypeError;
    var ValueCheckDereferenceError = class extends Error {
      constructor(schema) {
        super(`ValueCheck: Unable to dereference schema with $id '${schema.$ref}'`);
        this.schema = schema;
      }
    };
    exports2.ValueCheckDereferenceError = ValueCheckDereferenceError;
    var ValueCheck;
    (function(ValueCheck2) {
      function IsBigInt(value) {
        return typeof value === "bigint";
      }
      function IsInteger(value) {
        return globalThis.Number.isInteger(value);
      }
      function IsString(value) {
        return typeof value === "string";
      }
      function IsDefined(value) {
        return value !== void 0;
      }
      function IsExactOptionalProperty(value, key) {
        return index_1.TypeSystem.ExactOptionalPropertyTypes ? key in value : value[key] !== void 0;
      }
      function IsObject(value) {
        const result = typeof value === "object" && value !== null;
        return index_1.TypeSystem.AllowArrayObjects ? result : result && !globalThis.Array.isArray(value);
      }
      function IsRecordObject(value) {
        return IsObject(value) && !(value instanceof globalThis.Date) && !(value instanceof globalThis.Uint8Array);
      }
      function IsNumber(value) {
        const result = typeof value === "number";
        return index_1.TypeSystem.AllowNaN ? result : result && globalThis.Number.isFinite(value);
      }
      function IsVoid(value) {
        const result = value === void 0;
        return index_1.TypeSystem.AllowVoidNull ? result || value === null : result;
      }
      function Any(schema, references, value) {
        return true;
      }
      function Array2(schema, references, value) {
        if (!globalThis.Array.isArray(value)) {
          return false;
        }
        if (IsDefined(schema.minItems) && !(value.length >= schema.minItems)) {
          return false;
        }
        if (IsDefined(schema.maxItems) && !(value.length <= schema.maxItems)) {
          return false;
        }
        if (schema.uniqueItems === true && !(function() {
          const set = /* @__PURE__ */ new Set();
          for (const element of value) {
            const hashed = hash_1.ValueHash.Create(element);
            if (set.has(hashed)) {
              return false;
            } else {
              set.add(hashed);
            }
          }
          return true;
        })()) {
          return false;
        }
        return value.every((value2) => Visit(schema.items, references, value2));
      }
      function BigInt(schema, references, value) {
        if (!IsBigInt(value)) {
          return false;
        }
        if (IsDefined(schema.multipleOf) && !(value % schema.multipleOf === globalThis.BigInt(0))) {
          return false;
        }
        if (IsDefined(schema.exclusiveMinimum) && !(value > schema.exclusiveMinimum)) {
          return false;
        }
        if (IsDefined(schema.exclusiveMaximum) && !(value < schema.exclusiveMaximum)) {
          return false;
        }
        if (IsDefined(schema.minimum) && !(value >= schema.minimum)) {
          return false;
        }
        if (IsDefined(schema.maximum) && !(value <= schema.maximum)) {
          return false;
        }
        return true;
      }
      function Boolean2(schema, references, value) {
        return typeof value === "boolean";
      }
      function Constructor(schema, references, value) {
        return Visit(schema.returns, references, value.prototype);
      }
      function Date2(schema, references, value) {
        if (!(value instanceof globalThis.Date)) {
          return false;
        }
        if (!IsNumber(value.getTime())) {
          return false;
        }
        if (IsDefined(schema.exclusiveMinimumTimestamp) && !(value.getTime() > schema.exclusiveMinimumTimestamp)) {
          return false;
        }
        if (IsDefined(schema.exclusiveMaximumTimestamp) && !(value.getTime() < schema.exclusiveMaximumTimestamp)) {
          return false;
        }
        if (IsDefined(schema.minimumTimestamp) && !(value.getTime() >= schema.minimumTimestamp)) {
          return false;
        }
        if (IsDefined(schema.maximumTimestamp) && !(value.getTime() <= schema.maximumTimestamp)) {
          return false;
        }
        return true;
      }
      function Function(schema, references, value) {
        return typeof value === "function";
      }
      function Integer(schema, references, value) {
        if (!IsInteger(value)) {
          return false;
        }
        if (IsDefined(schema.multipleOf) && !(value % schema.multipleOf === 0)) {
          return false;
        }
        if (IsDefined(schema.exclusiveMinimum) && !(value > schema.exclusiveMinimum)) {
          return false;
        }
        if (IsDefined(schema.exclusiveMaximum) && !(value < schema.exclusiveMaximum)) {
          return false;
        }
        if (IsDefined(schema.minimum) && !(value >= schema.minimum)) {
          return false;
        }
        if (IsDefined(schema.maximum) && !(value <= schema.maximum)) {
          return false;
        }
        return true;
      }
      function Intersect(schema, references, value) {
        if (!schema.allOf.every((schema2) => Visit(schema2, references, value))) {
          return false;
        } else if (schema.unevaluatedProperties === false) {
          const schemaKeys = Types.KeyResolver.Resolve(schema);
          const valueKeys = globalThis.Object.getOwnPropertyNames(value);
          return valueKeys.every((key) => schemaKeys.includes(key));
        } else if (Types.TypeGuard.TSchema(schema.unevaluatedProperties)) {
          const schemaKeys = Types.KeyResolver.Resolve(schema);
          const valueKeys = globalThis.Object.getOwnPropertyNames(value);
          return valueKeys.every((key) => schemaKeys.includes(key) || Visit(schema.unevaluatedProperties, references, value[key]));
        } else {
          return true;
        }
      }
      function Literal(schema, references, value) {
        return value === schema.const;
      }
      function Never(schema, references, value) {
        return false;
      }
      function Not(schema, references, value) {
        return !Visit(schema.allOf[0].not, references, value) && Visit(schema.allOf[1], references, value);
      }
      function Null(schema, references, value) {
        return value === null;
      }
      function Number2(schema, references, value) {
        if (!IsNumber(value)) {
          return false;
        }
        if (IsDefined(schema.multipleOf) && !(value % schema.multipleOf === 0)) {
          return false;
        }
        if (IsDefined(schema.exclusiveMinimum) && !(value > schema.exclusiveMinimum)) {
          return false;
        }
        if (IsDefined(schema.exclusiveMaximum) && !(value < schema.exclusiveMaximum)) {
          return false;
        }
        if (IsDefined(schema.minimum) && !(value >= schema.minimum)) {
          return false;
        }
        if (IsDefined(schema.maximum) && !(value <= schema.maximum)) {
          return false;
        }
        return true;
      }
      function Object2(schema, references, value) {
        if (!IsObject(value)) {
          return false;
        }
        if (IsDefined(schema.minProperties) && !(globalThis.Object.getOwnPropertyNames(value).length >= schema.minProperties)) {
          return false;
        }
        if (IsDefined(schema.maxProperties) && !(globalThis.Object.getOwnPropertyNames(value).length <= schema.maxProperties)) {
          return false;
        }
        const knownKeys = globalThis.Object.getOwnPropertyNames(schema.properties);
        for (const knownKey of knownKeys) {
          const property = schema.properties[knownKey];
          if (schema.required && schema.required.includes(knownKey)) {
            if (!Visit(property, references, value[knownKey])) {
              return false;
            }
            if (Types.ExtendsUndefined.Check(property)) {
              return knownKey in value;
            }
          } else {
            if (IsExactOptionalProperty(value, knownKey) && !Visit(property, references, value[knownKey])) {
              return false;
            }
          }
        }
        if (schema.additionalProperties === false) {
          const valueKeys = globalThis.Object.getOwnPropertyNames(value);
          if (schema.required && schema.required.length === knownKeys.length && valueKeys.length === knownKeys.length) {
            return true;
          } else {
            return valueKeys.every((valueKey) => knownKeys.includes(valueKey));
          }
        } else if (typeof schema.additionalProperties === "object") {
          const valueKeys = globalThis.Object.getOwnPropertyNames(value);
          return valueKeys.every((key) => knownKeys.includes(key) || Visit(schema.additionalProperties, references, value[key]));
        } else {
          return true;
        }
      }
      function Promise2(schema, references, value) {
        return typeof value === "object" && typeof value.then === "function";
      }
      function Record(schema, references, value) {
        if (!IsRecordObject(value)) {
          return false;
        }
        if (IsDefined(schema.minProperties) && !(globalThis.Object.getOwnPropertyNames(value).length >= schema.minProperties)) {
          return false;
        }
        if (IsDefined(schema.maxProperties) && !(globalThis.Object.getOwnPropertyNames(value).length <= schema.maxProperties)) {
          return false;
        }
        const [keyPattern, valueSchema] = globalThis.Object.entries(schema.patternProperties)[0];
        const regex = new RegExp(keyPattern);
        if (!globalThis.Object.getOwnPropertyNames(value).every((key) => regex.test(key))) {
          return false;
        }
        for (const propValue of globalThis.Object.values(value)) {
          if (!Visit(valueSchema, references, propValue))
            return false;
        }
        return true;
      }
      function Ref(schema, references, value) {
        const index = references.findIndex((foreign) => foreign.$id === schema.$ref);
        if (index === -1)
          throw new ValueCheckDereferenceError(schema);
        const target = references[index];
        return Visit(target, references, value);
      }
      function String2(schema, references, value) {
        if (!IsString(value)) {
          return false;
        }
        if (IsDefined(schema.minLength)) {
          if (!(value.length >= schema.minLength))
            return false;
        }
        if (IsDefined(schema.maxLength)) {
          if (!(value.length <= schema.maxLength))
            return false;
        }
        if (IsDefined(schema.pattern)) {
          const regex = new RegExp(schema.pattern);
          if (!regex.test(value))
            return false;
        }
        if (IsDefined(schema.format)) {
          if (!Types.FormatRegistry.Has(schema.format))
            return false;
          const func = Types.FormatRegistry.Get(schema.format);
          return func(value);
        }
        return true;
      }
      function Symbol2(schema, references, value) {
        if (!(typeof value === "symbol")) {
          return false;
        }
        return true;
      }
      function TemplateLiteral(schema, references, value) {
        if (!IsString(value)) {
          return false;
        }
        return new RegExp(schema.pattern).test(value);
      }
      function This(schema, references, value) {
        const index = references.findIndex((foreign) => foreign.$id === schema.$ref);
        if (index === -1)
          throw new ValueCheckDereferenceError(schema);
        const target = references[index];
        return Visit(target, references, value);
      }
      function Tuple(schema, references, value) {
        if (!globalThis.Array.isArray(value)) {
          return false;
        }
        if (schema.items === void 0 && !(value.length === 0)) {
          return false;
        }
        if (!(value.length === schema.maxItems)) {
          return false;
        }
        if (!schema.items) {
          return true;
        }
        for (let i = 0; i < schema.items.length; i++) {
          if (!Visit(schema.items[i], references, value[i]))
            return false;
        }
        return true;
      }
      function Undefined(schema, references, value) {
        return value === void 0;
      }
      function Union(schema, references, value) {
        return schema.anyOf.some((inner) => Visit(inner, references, value));
      }
      function Uint8Array2(schema, references, value) {
        if (!(value instanceof globalThis.Uint8Array)) {
          return false;
        }
        if (IsDefined(schema.maxByteLength) && !(value.length <= schema.maxByteLength)) {
          return false;
        }
        if (IsDefined(schema.minByteLength) && !(value.length >= schema.minByteLength)) {
          return false;
        }
        return true;
      }
      function Unknown(schema, references, value) {
        return true;
      }
      function Void(schema, references, value) {
        return IsVoid(value);
      }
      function UserDefined(schema, references, value) {
        if (!Types.TypeRegistry.Has(schema[Types.Kind]))
          return false;
        const func = Types.TypeRegistry.Get(schema[Types.Kind]);
        return func(schema, value);
      }
      function Visit(schema, references, value) {
        const references_ = IsDefined(schema.$id) ? [...references, schema] : references;
        const schema_ = schema;
        switch (schema_[Types.Kind]) {
          case "Any":
            return Any(schema_, references_, value);
          case "Array":
            return Array2(schema_, references_, value);
          case "BigInt":
            return BigInt(schema_, references_, value);
          case "Boolean":
            return Boolean2(schema_, references_, value);
          case "Constructor":
            return Constructor(schema_, references_, value);
          case "Date":
            return Date2(schema_, references_, value);
          case "Function":
            return Function(schema_, references_, value);
          case "Integer":
            return Integer(schema_, references_, value);
          case "Intersect":
            return Intersect(schema_, references_, value);
          case "Literal":
            return Literal(schema_, references_, value);
          case "Never":
            return Never(schema_, references_, value);
          case "Not":
            return Not(schema_, references_, value);
          case "Null":
            return Null(schema_, references_, value);
          case "Number":
            return Number2(schema_, references_, value);
          case "Object":
            return Object2(schema_, references_, value);
          case "Promise":
            return Promise2(schema_, references_, value);
          case "Record":
            return Record(schema_, references_, value);
          case "Ref":
            return Ref(schema_, references_, value);
          case "String":
            return String2(schema_, references_, value);
          case "Symbol":
            return Symbol2(schema_, references_, value);
          case "TemplateLiteral":
            return TemplateLiteral(schema_, references_, value);
          case "This":
            return This(schema_, references_, value);
          case "Tuple":
            return Tuple(schema_, references_, value);
          case "Undefined":
            return Undefined(schema_, references_, value);
          case "Union":
            return Union(schema_, references_, value);
          case "Uint8Array":
            return Uint8Array2(schema_, references_, value);
          case "Unknown":
            return Unknown(schema_, references_, value);
          case "Void":
            return Void(schema_, references_, value);
          default:
            if (!Types.TypeRegistry.Has(schema_[Types.Kind]))
              throw new ValueCheckUnknownTypeError(schema_);
            return UserDefined(schema_, references_, value);
        }
      }
      function Check(schema, references, value) {
        return Visit(schema, references, value);
      }
      ValueCheck2.Check = Check;
    })(ValueCheck = exports2.ValueCheck || (exports2.ValueCheck = {}));
  }
});

// node_modules/@sinclair/typebox/value/create.js
var require_create = __commonJS({
  "node_modules/@sinclair/typebox/value/create.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.ValueCreate = exports2.ValueCreateDereferenceError = exports2.ValueCreateTempateLiteralTypeError = exports2.ValueCreateIntersectTypeError = exports2.ValueCreateNeverTypeError = exports2.ValueCreateUnknownTypeError = void 0;
    var Types = require_typebox();
    var check_1 = require_check();
    var ValueCreateUnknownTypeError = class extends Error {
      constructor(schema) {
        super("ValueCreate: Unknown type");
        this.schema = schema;
      }
    };
    exports2.ValueCreateUnknownTypeError = ValueCreateUnknownTypeError;
    var ValueCreateNeverTypeError = class extends Error {
      constructor(schema) {
        super("ValueCreate: Never types cannot be created");
        this.schema = schema;
      }
    };
    exports2.ValueCreateNeverTypeError = ValueCreateNeverTypeError;
    var ValueCreateIntersectTypeError = class extends Error {
      constructor(schema) {
        super("ValueCreate: Intersect produced invalid value. Consider using a default value.");
        this.schema = schema;
      }
    };
    exports2.ValueCreateIntersectTypeError = ValueCreateIntersectTypeError;
    var ValueCreateTempateLiteralTypeError = class extends Error {
      constructor(schema) {
        super("ValueCreate: Can only create template literal values from patterns that produce finite sequences. Consider using a default value.");
        this.schema = schema;
      }
    };
    exports2.ValueCreateTempateLiteralTypeError = ValueCreateTempateLiteralTypeError;
    var ValueCreateDereferenceError = class extends Error {
      constructor(schema) {
        super(`ValueCreate: Unable to dereference schema with $id '${schema.$ref}'`);
        this.schema = schema;
      }
    };
    exports2.ValueCreateDereferenceError = ValueCreateDereferenceError;
    var ValueCreate;
    (function(ValueCreate2) {
      function IsString(value) {
        return typeof value === "string";
      }
      function Any(schema, references) {
        if ("default" in schema) {
          return schema.default;
        } else {
          return {};
        }
      }
      function Array2(schema, references) {
        if (schema.uniqueItems === true && schema.default === void 0) {
          throw new Error("ValueCreate.Array: Arrays with uniqueItems require a default value");
        } else if ("default" in schema) {
          return schema.default;
        } else if (schema.minItems !== void 0) {
          return globalThis.Array.from({ length: schema.minItems }).map((item) => {
            return ValueCreate2.Create(schema.items, references);
          });
        } else {
          return [];
        }
      }
      function BigInt(schema, references) {
        if ("default" in schema) {
          return schema.default;
        } else {
          return globalThis.BigInt(0);
        }
      }
      function Boolean2(schema, references) {
        if ("default" in schema) {
          return schema.default;
        } else {
          return false;
        }
      }
      function Constructor(schema, references) {
        if ("default" in schema) {
          return schema.default;
        } else {
          const value = ValueCreate2.Create(schema.returns, references);
          if (typeof value === "object" && !globalThis.Array.isArray(value)) {
            return class {
              constructor() {
                for (const [key, val] of globalThis.Object.entries(value)) {
                  const self = this;
                  self[key] = val;
                }
              }
            };
          } else {
            return class {
            };
          }
        }
      }
      function Date2(schema, references) {
        if ("default" in schema) {
          return schema.default;
        } else if (schema.minimumTimestamp !== void 0) {
          return new globalThis.Date(schema.minimumTimestamp);
        } else {
          return new globalThis.Date(0);
        }
      }
      function Function(schema, references) {
        if ("default" in schema) {
          return schema.default;
        } else {
          return () => ValueCreate2.Create(schema.returns, references);
        }
      }
      function Integer(schema, references) {
        if ("default" in schema) {
          return schema.default;
        } else if (schema.minimum !== void 0) {
          return schema.minimum;
        } else {
          return 0;
        }
      }
      function Intersect(schema, references) {
        if ("default" in schema) {
          return schema.default;
        } else {
          const value = schema.allOf.reduce((acc, schema2) => {
            const next = Visit(schema2, references);
            return typeof next === "object" ? { ...acc, ...next } : next;
          }, {});
          if (!check_1.ValueCheck.Check(schema, references, value))
            throw new ValueCreateIntersectTypeError(schema);
          return value;
        }
      }
      function Literal(schema, references) {
        if ("default" in schema) {
          return schema.default;
        } else {
          return schema.const;
        }
      }
      function Never(schema, references) {
        throw new ValueCreateNeverTypeError(schema);
      }
      function Not(schema, references) {
        if ("default" in schema) {
          return schema.default;
        } else {
          return Visit(schema.allOf[1], references);
        }
      }
      function Null(schema, references) {
        if ("default" in schema) {
          return schema.default;
        } else {
          return null;
        }
      }
      function Number2(schema, references) {
        if ("default" in schema) {
          return schema.default;
        } else if (schema.minimum !== void 0) {
          return schema.minimum;
        } else {
          return 0;
        }
      }
      function Object2(schema, references) {
        if ("default" in schema) {
          return schema.default;
        } else {
          const required = new Set(schema.required);
          return schema.default || globalThis.Object.entries(schema.properties).reduce((acc, [key, schema2]) => {
            return required.has(key) ? { ...acc, [key]: ValueCreate2.Create(schema2, references) } : { ...acc };
          }, {});
        }
      }
      function Promise2(schema, references) {
        if ("default" in schema) {
          return schema.default;
        } else {
          return globalThis.Promise.resolve(ValueCreate2.Create(schema.item, references));
        }
      }
      function Record(schema, references) {
        const [keyPattern, valueSchema] = globalThis.Object.entries(schema.patternProperties)[0];
        if ("default" in schema) {
          return schema.default;
        } else if (!(keyPattern === Types.PatternStringExact || keyPattern === Types.PatternNumberExact)) {
          const propertyKeys = keyPattern.slice(1, keyPattern.length - 1).split("|");
          return propertyKeys.reduce((acc, key) => {
            return { ...acc, [key]: Create(valueSchema, references) };
          }, {});
        } else {
          return {};
        }
      }
      function Ref(schema, references) {
        if ("default" in schema) {
          return schema.default;
        } else {
          const index = references.findIndex((foreign) => foreign.$id === schema.$id);
          if (index === -1)
            throw new ValueCreateDereferenceError(schema);
          const target = references[index];
          return Visit(target, references);
        }
      }
      function String2(schema, references) {
        if (schema.pattern !== void 0) {
          if (!("default" in schema)) {
            throw new Error("ValueCreate.String: String types with patterns must specify a default value");
          } else {
            return schema.default;
          }
        } else if (schema.format !== void 0) {
          if (!("default" in schema)) {
            throw new Error("ValueCreate.String: String types with formats must specify a default value");
          } else {
            return schema.default;
          }
        } else {
          if ("default" in schema) {
            return schema.default;
          } else if (schema.minLength !== void 0) {
            return globalThis.Array.from({ length: schema.minLength }).map(() => ".").join("");
          } else {
            return "";
          }
        }
      }
      function Symbol2(schema, references) {
        if ("default" in schema) {
          return schema.default;
        } else if ("value" in schema) {
          return globalThis.Symbol.for(schema.value);
        } else {
          return globalThis.Symbol();
        }
      }
      function TemplateLiteral(schema, references) {
        if ("default" in schema) {
          return schema.default;
        }
        const expression = Types.TemplateLiteralParser.ParseExact(schema.pattern);
        if (!Types.TemplateLiteralFinite.Check(expression))
          throw new ValueCreateTempateLiteralTypeError(schema);
        const sequence = Types.TemplateLiteralGenerator.Generate(expression);
        return sequence.next().value;
      }
      function This(schema, references) {
        if ("default" in schema) {
          return schema.default;
        } else {
          const index = references.findIndex((foreign) => foreign.$id === schema.$id);
          if (index === -1)
            throw new ValueCreateDereferenceError(schema);
          const target = references[index];
          return Visit(target, references);
        }
      }
      function Tuple(schema, references) {
        if ("default" in schema) {
          return schema.default;
        }
        if (schema.items === void 0) {
          return [];
        } else {
          return globalThis.Array.from({ length: schema.minItems }).map((_, index) => ValueCreate2.Create(schema.items[index], references));
        }
      }
      function Undefined(schema, references) {
        if ("default" in schema) {
          return schema.default;
        } else {
          return void 0;
        }
      }
      function Union(schema, references) {
        if ("default" in schema) {
          return schema.default;
        } else if (schema.anyOf.length === 0) {
          throw new Error("ValueCreate.Union: Cannot create Union with zero variants");
        } else {
          return ValueCreate2.Create(schema.anyOf[0], references);
        }
      }
      function Uint8Array2(schema, references) {
        if ("default" in schema) {
          return schema.default;
        } else if (schema.minByteLength !== void 0) {
          return new globalThis.Uint8Array(schema.minByteLength);
        } else {
          return new globalThis.Uint8Array(0);
        }
      }
      function Unknown(schema, references) {
        if ("default" in schema) {
          return schema.default;
        } else {
          return {};
        }
      }
      function Void(schema, references) {
        if ("default" in schema) {
          return schema.default;
        } else {
          return void 0;
        }
      }
      function UserDefined(schema, references) {
        if ("default" in schema) {
          return schema.default;
        } else {
          throw new Error("ValueCreate.UserDefined: User defined types must specify a default value");
        }
      }
      function Visit(schema, references) {
        const references_ = IsString(schema.$id) ? [...references, schema] : references;
        const schema_ = schema;
        switch (schema_[Types.Kind]) {
          case "Any":
            return Any(schema_, references_);
          case "Array":
            return Array2(schema_, references_);
          case "BigInt":
            return BigInt(schema_, references_);
          case "Boolean":
            return Boolean2(schema_, references_);
          case "Constructor":
            return Constructor(schema_, references_);
          case "Date":
            return Date2(schema_, references_);
          case "Function":
            return Function(schema_, references_);
          case "Integer":
            return Integer(schema_, references_);
          case "Intersect":
            return Intersect(schema_, references_);
          case "Literal":
            return Literal(schema_, references_);
          case "Never":
            return Never(schema_, references_);
          case "Not":
            return Not(schema_, references_);
          case "Null":
            return Null(schema_, references_);
          case "Number":
            return Number2(schema_, references_);
          case "Object":
            return Object2(schema_, references_);
          case "Promise":
            return Promise2(schema_, references_);
          case "Record":
            return Record(schema_, references_);
          case "Ref":
            return Ref(schema_, references_);
          case "String":
            return String2(schema_, references_);
          case "Symbol":
            return Symbol2(schema_, references_);
          case "TemplateLiteral":
            return TemplateLiteral(schema_, references_);
          case "This":
            return This(schema_, references_);
          case "Tuple":
            return Tuple(schema_, references_);
          case "Undefined":
            return Undefined(schema_, references_);
          case "Union":
            return Union(schema_, references_);
          case "Uint8Array":
            return Uint8Array2(schema_, references_);
          case "Unknown":
            return Unknown(schema_, references_);
          case "Void":
            return Void(schema_, references_);
          default:
            if (!Types.TypeRegistry.Has(schema_[Types.Kind]))
              throw new ValueCreateUnknownTypeError(schema_);
            return UserDefined(schema_, references_);
        }
      }
      ValueCreate2.Visit = Visit;
      function Create(schema, references) {
        return Visit(schema, references);
      }
      ValueCreate2.Create = Create;
    })(ValueCreate = exports2.ValueCreate || (exports2.ValueCreate = {}));
  }
});

// node_modules/@sinclair/typebox/value/cast.js
var require_cast = __commonJS({
  "node_modules/@sinclair/typebox/value/cast.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.ValueCast = exports2.ValueCastDereferenceError = exports2.ValueCastUnknownTypeError = exports2.ValueCastRecursiveTypeError = exports2.ValueCastNeverTypeError = exports2.ValueCastArrayUniqueItemsTypeError = exports2.ValueCastReferenceTypeError = void 0;
    var Types = require_typebox();
    var create_1 = require_create();
    var check_1 = require_check();
    var clone_1 = require_clone();
    var ValueCastReferenceTypeError = class extends Error {
      constructor(schema) {
        super(`ValueCast: Cannot locate referenced schema with $id '${schema.$ref}'`);
        this.schema = schema;
      }
    };
    exports2.ValueCastReferenceTypeError = ValueCastReferenceTypeError;
    var ValueCastArrayUniqueItemsTypeError = class extends Error {
      constructor(schema, value) {
        super("ValueCast: Array cast produced invalid data due to uniqueItems constraint");
        this.schema = schema;
        this.value = value;
      }
    };
    exports2.ValueCastArrayUniqueItemsTypeError = ValueCastArrayUniqueItemsTypeError;
    var ValueCastNeverTypeError = class extends Error {
      constructor(schema) {
        super("ValueCast: Never types cannot be cast");
        this.schema = schema;
      }
    };
    exports2.ValueCastNeverTypeError = ValueCastNeverTypeError;
    var ValueCastRecursiveTypeError = class extends Error {
      constructor(schema) {
        super("ValueCast.Recursive: Cannot cast recursive schemas");
        this.schema = schema;
      }
    };
    exports2.ValueCastRecursiveTypeError = ValueCastRecursiveTypeError;
    var ValueCastUnknownTypeError = class extends Error {
      constructor(schema) {
        super("ValueCast: Unknown type");
        this.schema = schema;
      }
    };
    exports2.ValueCastUnknownTypeError = ValueCastUnknownTypeError;
    var ValueCastDereferenceError = class extends Error {
      constructor(schema) {
        super(`ValueCast: Unable to dereference schema with $id '${schema.$ref}'`);
        this.schema = schema;
      }
    };
    exports2.ValueCastDereferenceError = ValueCastDereferenceError;
    var UnionCastCreate;
    (function(UnionCastCreate2) {
      function Score(schema, references, value) {
        if (schema[Types.Kind] === "Object" && typeof value === "object" && value !== null) {
          const object = schema;
          const keys = Object.keys(value);
          const entries = globalThis.Object.entries(object.properties);
          const [point, max] = [1 / entries.length, entries.length];
          return entries.reduce((acc, [key, schema2]) => {
            const literal = schema2[Types.Kind] === "Literal" && schema2.const === value[key] ? max : 0;
            const checks = check_1.ValueCheck.Check(schema2, references, value[key]) ? point : 0;
            const exists = keys.includes(key) ? point : 0;
            return acc + (literal + checks + exists);
          }, 0);
        } else {
          return check_1.ValueCheck.Check(schema, references, value) ? 1 : 0;
        }
      }
      function Select(union, references, value) {
        let [select, best] = [union.anyOf[0], 0];
        for (const schema of union.anyOf) {
          const score = Score(schema, references, value);
          if (score > best) {
            select = schema;
            best = score;
          }
        }
        return select;
      }
      function Create(union, references, value) {
        if (union.default !== void 0) {
          return union.default;
        } else {
          const schema = Select(union, references, value);
          return ValueCast.Cast(schema, references, value);
        }
      }
      UnionCastCreate2.Create = Create;
    })(UnionCastCreate || (UnionCastCreate = {}));
    var ValueCast;
    (function(ValueCast2) {
      function IsObject(value) {
        return typeof value === "object" && value !== null && !globalThis.Array.isArray(value);
      }
      function IsArray(value) {
        return typeof value === "object" && globalThis.Array.isArray(value);
      }
      function IsNumber(value) {
        return typeof value === "number" && !isNaN(value);
      }
      function IsString(value) {
        return typeof value === "string";
      }
      function Any(schema, references, value) {
        return check_1.ValueCheck.Check(schema, references, value) ? clone_1.ValueClone.Clone(value) : create_1.ValueCreate.Create(schema, references);
      }
      function Array2(schema, references, value) {
        if (check_1.ValueCheck.Check(schema, references, value))
          return clone_1.ValueClone.Clone(value);
        const created = IsArray(value) ? clone_1.ValueClone.Clone(value) : create_1.ValueCreate.Create(schema, references);
        const minimum = IsNumber(schema.minItems) && created.length < schema.minItems ? [...created, ...globalThis.Array.from({ length: schema.minItems - created.length }, () => null)] : created;
        const maximum = IsNumber(schema.maxItems) && minimum.length > schema.maxItems ? minimum.slice(0, schema.maxItems) : minimum;
        const casted = maximum.map((value2) => Visit(schema.items, references, value2));
        if (schema.uniqueItems !== true)
          return casted;
        const unique = [...new Set(casted)];
        if (!check_1.ValueCheck.Check(schema, references, unique))
          throw new ValueCastArrayUniqueItemsTypeError(schema, unique);
        return unique;
      }
      function BigInt(schema, references, value) {
        return check_1.ValueCheck.Check(schema, references, value) ? value : create_1.ValueCreate.Create(schema, references);
      }
      function Boolean2(schema, references, value) {
        return check_1.ValueCheck.Check(schema, references, value) ? value : create_1.ValueCreate.Create(schema, references);
      }
      function Constructor(schema, references, value) {
        if (check_1.ValueCheck.Check(schema, references, value))
          return create_1.ValueCreate.Create(schema, references);
        const required = new Set(schema.returns.required || []);
        const result = function() {
        };
        for (const [key, property] of globalThis.Object.entries(schema.returns.properties)) {
          if (!required.has(key) && value.prototype[key] === void 0)
            continue;
          result.prototype[key] = Visit(property, references, value.prototype[key]);
        }
        return result;
      }
      function Date2(schema, references, value) {
        return check_1.ValueCheck.Check(schema, references, value) ? clone_1.ValueClone.Clone(value) : create_1.ValueCreate.Create(schema, references);
      }
      function Function(schema, references, value) {
        return check_1.ValueCheck.Check(schema, references, value) ? value : create_1.ValueCreate.Create(schema, references);
      }
      function Integer(schema, references, value) {
        return check_1.ValueCheck.Check(schema, references, value) ? value : create_1.ValueCreate.Create(schema, references);
      }
      function Intersect(schema, references, value) {
        const created = create_1.ValueCreate.Create(schema, references);
        const mapped = IsObject(created) && IsObject(value) ? { ...created, ...value } : value;
        return check_1.ValueCheck.Check(schema, references, mapped) ? mapped : create_1.ValueCreate.Create(schema, references);
      }
      function Literal(schema, references, value) {
        return check_1.ValueCheck.Check(schema, references, value) ? value : create_1.ValueCreate.Create(schema, references);
      }
      function Never(schema, references, value) {
        throw new ValueCastNeverTypeError(schema);
      }
      function Not(schema, references, value) {
        return check_1.ValueCheck.Check(schema, references, value) ? value : create_1.ValueCreate.Create(schema.allOf[1], references);
      }
      function Null(schema, references, value) {
        return check_1.ValueCheck.Check(schema, references, value) ? value : create_1.ValueCreate.Create(schema, references);
      }
      function Number2(schema, references, value) {
        return check_1.ValueCheck.Check(schema, references, value) ? value : create_1.ValueCreate.Create(schema, references);
      }
      function Object2(schema, references, value) {
        if (check_1.ValueCheck.Check(schema, references, value))
          return value;
        if (value === null || typeof value !== "object")
          return create_1.ValueCreate.Create(schema, references);
        const required = new Set(schema.required || []);
        const result = {};
        for (const [key, property] of globalThis.Object.entries(schema.properties)) {
          if (!required.has(key) && value[key] === void 0)
            continue;
          result[key] = Visit(property, references, value[key]);
        }
        if (typeof schema.additionalProperties === "object") {
          const propertyNames = globalThis.Object.getOwnPropertyNames(schema.properties);
          for (const propertyName of globalThis.Object.getOwnPropertyNames(value)) {
            if (propertyNames.includes(propertyName))
              continue;
            result[propertyName] = Visit(schema.additionalProperties, references, value[propertyName]);
          }
        }
        return result;
      }
      function Promise2(schema, references, value) {
        return check_1.ValueCheck.Check(schema, references, value) ? value : create_1.ValueCreate.Create(schema, references);
      }
      function Record(schema, references, value) {
        if (check_1.ValueCheck.Check(schema, references, value))
          return clone_1.ValueClone.Clone(value);
        if (value === null || typeof value !== "object" || globalThis.Array.isArray(value) || value instanceof globalThis.Date)
          return create_1.ValueCreate.Create(schema, references);
        const subschemaPropertyName = globalThis.Object.getOwnPropertyNames(schema.patternProperties)[0];
        const subschema = schema.patternProperties[subschemaPropertyName];
        const result = {};
        for (const [propKey, propValue] of globalThis.Object.entries(value)) {
          result[propKey] = Visit(subschema, references, propValue);
        }
        return result;
      }
      function Ref(schema, references, value) {
        const index = references.findIndex((foreign) => foreign.$id === schema.$ref);
        if (index === -1)
          throw new ValueCastDereferenceError(schema);
        const target = references[index];
        return Visit(target, references, value);
      }
      function String2(schema, references, value) {
        return check_1.ValueCheck.Check(schema, references, value) ? value : create_1.ValueCreate.Create(schema, references);
      }
      function Symbol2(schema, references, value) {
        return check_1.ValueCheck.Check(schema, references, value) ? clone_1.ValueClone.Clone(value) : create_1.ValueCreate.Create(schema, references);
      }
      function TemplateLiteral(schema, references, value) {
        return check_1.ValueCheck.Check(schema, references, value) ? clone_1.ValueClone.Clone(value) : create_1.ValueCreate.Create(schema, references);
      }
      function This(schema, references, value) {
        const index = references.findIndex((foreign) => foreign.$id === schema.$ref);
        if (index === -1)
          throw new ValueCastDereferenceError(schema);
        const target = references[index];
        return Visit(target, references, value);
      }
      function Tuple(schema, references, value) {
        if (check_1.ValueCheck.Check(schema, references, value))
          return clone_1.ValueClone.Clone(value);
        if (!globalThis.Array.isArray(value))
          return create_1.ValueCreate.Create(schema, references);
        if (schema.items === void 0)
          return [];
        return schema.items.map((schema2, index) => Visit(schema2, references, value[index]));
      }
      function Undefined(schema, references, value) {
        return check_1.ValueCheck.Check(schema, references, value) ? clone_1.ValueClone.Clone(value) : create_1.ValueCreate.Create(schema, references);
      }
      function Union(schema, references, value) {
        return check_1.ValueCheck.Check(schema, references, value) ? clone_1.ValueClone.Clone(value) : UnionCastCreate.Create(schema, references, value);
      }
      function Uint8Array2(schema, references, value) {
        return check_1.ValueCheck.Check(schema, references, value) ? clone_1.ValueClone.Clone(value) : create_1.ValueCreate.Create(schema, references);
      }
      function Unknown(schema, references, value) {
        return check_1.ValueCheck.Check(schema, references, value) ? clone_1.ValueClone.Clone(value) : create_1.ValueCreate.Create(schema, references);
      }
      function Void(schema, references, value) {
        return check_1.ValueCheck.Check(schema, references, value) ? clone_1.ValueClone.Clone(value) : create_1.ValueCreate.Create(schema, references);
      }
      function UserDefined(schema, references, value) {
        return check_1.ValueCheck.Check(schema, references, value) ? clone_1.ValueClone.Clone(value) : create_1.ValueCreate.Create(schema, references);
      }
      function Visit(schema, references, value) {
        const references_ = IsString(schema.$id) ? [...references, schema] : references;
        const schema_ = schema;
        switch (schema[Types.Kind]) {
          case "Any":
            return Any(schema_, references_, value);
          case "Array":
            return Array2(schema_, references_, value);
          case "BigInt":
            return BigInt(schema_, references_, value);
          case "Boolean":
            return Boolean2(schema_, references_, value);
          case "Constructor":
            return Constructor(schema_, references_, value);
          case "Date":
            return Date2(schema_, references_, value);
          case "Function":
            return Function(schema_, references_, value);
          case "Integer":
            return Integer(schema_, references_, value);
          case "Intersect":
            return Intersect(schema_, references_, value);
          case "Literal":
            return Literal(schema_, references_, value);
          case "Never":
            return Never(schema_, references_, value);
          case "Not":
            return Not(schema_, references_, value);
          case "Null":
            return Null(schema_, references_, value);
          case "Number":
            return Number2(schema_, references_, value);
          case "Object":
            return Object2(schema_, references_, value);
          case "Promise":
            return Promise2(schema_, references_, value);
          case "Record":
            return Record(schema_, references_, value);
          case "Ref":
            return Ref(schema_, references_, value);
          case "String":
            return String2(schema_, references_, value);
          case "Symbol":
            return Symbol2(schema_, references_, value);
          case "TemplateLiteral":
            return TemplateLiteral(schema_, references_, value);
          case "This":
            return This(schema_, references_, value);
          case "Tuple":
            return Tuple(schema_, references_, value);
          case "Undefined":
            return Undefined(schema_, references_, value);
          case "Union":
            return Union(schema_, references_, value);
          case "Uint8Array":
            return Uint8Array2(schema_, references_, value);
          case "Unknown":
            return Unknown(schema_, references_, value);
          case "Void":
            return Void(schema_, references_, value);
          default:
            if (!Types.TypeRegistry.Has(schema_[Types.Kind]))
              throw new ValueCastUnknownTypeError(schema_);
            return UserDefined(schema_, references_, value);
        }
      }
      ValueCast2.Visit = Visit;
      function Cast(schema, references, value) {
        return Visit(schema, references, clone_1.ValueClone.Clone(value));
      }
      ValueCast2.Cast = Cast;
    })(ValueCast = exports2.ValueCast || (exports2.ValueCast = {}));
  }
});

// node_modules/@sinclair/typebox/value/convert.js
var require_convert = __commonJS({
  "node_modules/@sinclair/typebox/value/convert.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.ValueConvert = exports2.ValueConvertDereferenceError = exports2.ValueConvertUnknownTypeError = void 0;
    var Types = require_typebox();
    var clone_1 = require_clone();
    var check_1 = require_check();
    var ValueConvertUnknownTypeError = class extends Error {
      constructor(schema) {
        super("ValueConvert: Unknown type");
        this.schema = schema;
      }
    };
    exports2.ValueConvertUnknownTypeError = ValueConvertUnknownTypeError;
    var ValueConvertDereferenceError = class extends Error {
      constructor(schema) {
        super(`ValueConvert: Unable to dereference schema with $id '${schema.$ref}'`);
        this.schema = schema;
      }
    };
    exports2.ValueConvertDereferenceError = ValueConvertDereferenceError;
    var ValueConvert;
    (function(ValueConvert2) {
      function IsObject(value) {
        return typeof value === "object" && value !== null && !globalThis.Array.isArray(value);
      }
      function IsArray(value) {
        return typeof value === "object" && globalThis.Array.isArray(value);
      }
      function IsDate(value) {
        return typeof value === "object" && value instanceof globalThis.Date;
      }
      function IsSymbol(value) {
        return typeof value === "symbol";
      }
      function IsString(value) {
        return typeof value === "string";
      }
      function IsBoolean(value) {
        return typeof value === "boolean";
      }
      function IsBigInt(value) {
        return typeof value === "bigint";
      }
      function IsNumber(value) {
        return typeof value === "number" && !isNaN(value);
      }
      function IsStringNumeric(value) {
        return IsString(value) && !isNaN(value) && !isNaN(parseFloat(value));
      }
      function IsValueToString(value) {
        return IsBigInt(value) || IsBoolean(value) || IsNumber(value);
      }
      function IsValueTrue(value) {
        return value === true || IsNumber(value) && value === 1 || IsBigInt(value) && value === globalThis.BigInt("1") || IsString(value) && (value.toLowerCase() === "true" || value === "1");
      }
      function IsValueFalse(value) {
        return value === false || IsNumber(value) && value === 0 || IsBigInt(value) && value === globalThis.BigInt("0") || IsString(value) && (value.toLowerCase() === "false" || value === "0");
      }
      function IsTimeStringWithTimeZone(value) {
        return IsString(value) && /^(?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)$/i.test(value);
      }
      function IsTimeStringWithoutTimeZone(value) {
        return IsString(value) && /^(?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)?$/i.test(value);
      }
      function IsDateTimeStringWithTimeZone(value) {
        return IsString(value) && /^\d\d\d\d-[0-1]\d-[0-3]\dt(?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)$/i.test(value);
      }
      function IsDateTimeStringWithoutTimeZone(value) {
        return IsString(value) && /^\d\d\d\d-[0-1]\d-[0-3]\dt(?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)?$/i.test(value);
      }
      function IsDateString(value) {
        return IsString(value) && /^\d\d\d\d-[0-1]\d-[0-3]\d$/i.test(value);
      }
      function TryConvertLiteralString(value, target) {
        const conversion = TryConvertString(value);
        return conversion === target ? conversion : value;
      }
      function TryConvertLiteralNumber(value, target) {
        const conversion = TryConvertNumber(value);
        return conversion === target ? conversion : value;
      }
      function TryConvertLiteralBoolean(value, target) {
        const conversion = TryConvertBoolean(value);
        return conversion === target ? conversion : value;
      }
      function TryConvertLiteral(schema, value) {
        if (typeof schema.const === "string") {
          return TryConvertLiteralString(value, schema.const);
        } else if (typeof schema.const === "number") {
          return TryConvertLiteralNumber(value, schema.const);
        } else if (typeof schema.const === "boolean") {
          return TryConvertLiteralBoolean(value, schema.const);
        } else {
          return clone_1.ValueClone.Clone(value);
        }
      }
      function TryConvertBoolean(value) {
        return IsValueTrue(value) ? true : IsValueFalse(value) ? false : value;
      }
      function TryConvertBigInt(value) {
        return IsStringNumeric(value) ? globalThis.BigInt(parseInt(value)) : IsNumber(value) ? globalThis.BigInt(value | 0) : IsValueFalse(value) ? 0 : IsValueTrue(value) ? 1 : value;
      }
      function TryConvertString(value) {
        return IsValueToString(value) ? value.toString() : value;
      }
      function TryConvertNumber(value) {
        return IsStringNumeric(value) ? parseFloat(value) : IsValueTrue(value) ? 1 : IsValueFalse(value) ? 0 : value;
      }
      function TryConvertInteger(value) {
        return IsStringNumeric(value) ? parseInt(value) : IsNumber(value) ? value | 0 : IsValueTrue(value) ? 1 : IsValueFalse(value) ? 0 : value;
      }
      function TryConvertNull(value) {
        return IsString(value) && value.toLowerCase() === "null" ? null : value;
      }
      function TryConvertUndefined(value) {
        return IsString(value) && value === "undefined" ? void 0 : value;
      }
      function TryConvertDate(value) {
        return IsDate(value) ? value : IsNumber(value) ? new globalThis.Date(value) : IsValueTrue(value) ? new globalThis.Date(1) : IsValueFalse(value) ? new globalThis.Date(0) : IsStringNumeric(value) ? new globalThis.Date(parseInt(value)) : IsTimeStringWithoutTimeZone(value) ? new globalThis.Date(`1970-01-01T${value}.000Z`) : IsTimeStringWithTimeZone(value) ? new globalThis.Date(`1970-01-01T${value}`) : IsDateTimeStringWithoutTimeZone(value) ? new globalThis.Date(`${value}.000Z`) : IsDateTimeStringWithTimeZone(value) ? new globalThis.Date(value) : IsDateString(value) ? new globalThis.Date(`${value}T00:00:00.000Z`) : value;
      }
      function Any(schema, references, value) {
        return value;
      }
      function Array2(schema, references, value) {
        if (IsArray(value)) {
          return value.map((value2) => Visit(schema.items, references, value2));
        }
        return value;
      }
      function BigInt(schema, references, value) {
        return TryConvertBigInt(value);
      }
      function Boolean2(schema, references, value) {
        return TryConvertBoolean(value);
      }
      function Constructor(schema, references, value) {
        return clone_1.ValueClone.Clone(value);
      }
      function Date2(schema, references, value) {
        return TryConvertDate(value);
      }
      function Function(schema, references, value) {
        return value;
      }
      function Integer(schema, references, value) {
        return TryConvertInteger(value);
      }
      function Intersect(schema, references, value) {
        return value;
      }
      function Literal(schema, references, value) {
        return TryConvertLiteral(schema, value);
      }
      function Never(schema, references, value) {
        return value;
      }
      function Null(schema, references, value) {
        return TryConvertNull(value);
      }
      function Number2(schema, references, value) {
        return TryConvertNumber(value);
      }
      function Object2(schema, references, value) {
        if (IsObject(value))
          return globalThis.Object.keys(schema.properties).reduce((acc, key) => {
            return value[key] !== void 0 ? { ...acc, [key]: Visit(schema.properties[key], references, value[key]) } : { ...acc };
          }, value);
        return value;
      }
      function Promise2(schema, references, value) {
        return value;
      }
      function Record(schema, references, value) {
        const propertyKey = globalThis.Object.getOwnPropertyNames(schema.patternProperties)[0];
        const property = schema.patternProperties[propertyKey];
        const result = {};
        for (const [propKey, propValue] of globalThis.Object.entries(value)) {
          result[propKey] = Visit(property, references, propValue);
        }
        return result;
      }
      function Ref(schema, references, value) {
        const index = references.findIndex((foreign) => foreign.$id === schema.$ref);
        if (index === -1)
          throw new ValueConvertDereferenceError(schema);
        const target = references[index];
        return Visit(target, references, value);
      }
      function String2(schema, references, value) {
        return TryConvertString(value);
      }
      function Symbol2(schema, references, value) {
        return value;
      }
      function TemplateLiteral(schema, references, value) {
        return value;
      }
      function This(schema, references, value) {
        const index = references.findIndex((foreign) => foreign.$id === schema.$ref);
        if (index === -1)
          throw new ValueConvertDereferenceError(schema);
        const target = references[index];
        return Visit(target, references, value);
      }
      function Tuple(schema, references, value) {
        if (IsArray(value) && schema.items !== void 0) {
          return value.map((value2, index) => {
            return index < schema.items.length ? Visit(schema.items[index], references, value2) : value2;
          });
        }
        return value;
      }
      function Undefined(schema, references, value) {
        return TryConvertUndefined(value);
      }
      function Union(schema, references, value) {
        for (const subschema of schema.anyOf) {
          const converted = Visit(subschema, references, value);
          if (check_1.ValueCheck.Check(subschema, references, converted)) {
            return converted;
          }
        }
        return value;
      }
      function Uint8Array2(schema, references, value) {
        return value;
      }
      function Unknown(schema, references, value) {
        return value;
      }
      function Void(schema, references, value) {
        return value;
      }
      function UserDefined(schema, references, value) {
        return value;
      }
      function Visit(schema, references, value) {
        const references_ = IsString(schema.$id) ? [...references, schema] : references;
        const schema_ = schema;
        switch (schema[Types.Kind]) {
          case "Any":
            return Any(schema_, references_, value);
          case "Array":
            return Array2(schema_, references_, value);
          case "BigInt":
            return BigInt(schema_, references_, value);
          case "Boolean":
            return Boolean2(schema_, references_, value);
          case "Constructor":
            return Constructor(schema_, references_, value);
          case "Date":
            return Date2(schema_, references_, value);
          case "Function":
            return Function(schema_, references_, value);
          case "Integer":
            return Integer(schema_, references_, value);
          case "Intersect":
            return Intersect(schema_, references_, value);
          case "Literal":
            return Literal(schema_, references_, value);
          case "Never":
            return Never(schema_, references_, value);
          case "Null":
            return Null(schema_, references_, value);
          case "Number":
            return Number2(schema_, references_, value);
          case "Object":
            return Object2(schema_, references_, value);
          case "Promise":
            return Promise2(schema_, references_, value);
          case "Record":
            return Record(schema_, references_, value);
          case "Ref":
            return Ref(schema_, references_, value);
          case "String":
            return String2(schema_, references_, value);
          case "Symbol":
            return Symbol2(schema_, references_, value);
          case "TemplateLiteral":
            return TemplateLiteral(schema_, references_, value);
          case "This":
            return This(schema_, references_, value);
          case "Tuple":
            return Tuple(schema_, references_, value);
          case "Undefined":
            return Undefined(schema_, references_, value);
          case "Union":
            return Union(schema_, references_, value);
          case "Uint8Array":
            return Uint8Array2(schema_, references_, value);
          case "Unknown":
            return Unknown(schema_, references_, value);
          case "Void":
            return Void(schema_, references_, value);
          default:
            if (!Types.TypeRegistry.Has(schema_[Types.Kind]))
              throw new ValueConvertUnknownTypeError(schema_);
            return UserDefined(schema_, references_, value);
        }
      }
      ValueConvert2.Visit = Visit;
      function Convert(schema, references, value) {
        return Visit(schema, references, clone_1.ValueClone.Clone(value));
      }
      ValueConvert2.Convert = Convert;
    })(ValueConvert = exports2.ValueConvert || (exports2.ValueConvert = {}));
  }
});

// node_modules/@sinclair/typebox/value/value.js
var require_value = __commonJS({
  "node_modules/@sinclair/typebox/value/value.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.Value = void 0;
    var index_1 = require_errors2();
    var mutate_1 = require_mutate();
    var hash_1 = require_hash();
    var equal_1 = require_equal();
    var cast_1 = require_cast();
    var clone_1 = require_clone();
    var convert_1 = require_convert();
    var create_1 = require_create();
    var check_1 = require_check();
    var delta_1 = require_delta();
    var Value;
    (function(Value2) {
      function Cast(...args) {
        const [schema, references, value] = args.length === 3 ? [args[0], args[1], args[2]] : [args[0], [], args[1]];
        return cast_1.ValueCast.Cast(schema, references, value);
      }
      Value2.Cast = Cast;
      function Create(...args) {
        const [schema, references] = args.length === 2 ? [args[0], args[1]] : [args[0], []];
        return create_1.ValueCreate.Create(schema, references);
      }
      Value2.Create = Create;
      function Check(...args) {
        const [schema, references, value] = args.length === 3 ? [args[0], args[1], args[2]] : [args[0], [], args[1]];
        return check_1.ValueCheck.Check(schema, references, value);
      }
      Value2.Check = Check;
      function Convert(...args) {
        const [schema, references, value] = args.length === 3 ? [args[0], args[1], args[2]] : [args[0], [], args[1]];
        return convert_1.ValueConvert.Convert(schema, references, value);
      }
      Value2.Convert = Convert;
      function Clone(value) {
        return clone_1.ValueClone.Clone(value);
      }
      Value2.Clone = Clone;
      function Errors(...args) {
        const [schema, references, value] = args.length === 3 ? [args[0], args[1], args[2]] : [args[0], [], args[1]];
        return index_1.ValueErrors.Errors(schema, references, value);
      }
      Value2.Errors = Errors;
      function Equal(left, right) {
        return equal_1.ValueEqual.Equal(left, right);
      }
      Value2.Equal = Equal;
      function Diff(current, next) {
        return delta_1.ValueDelta.Diff(current, next);
      }
      Value2.Diff = Diff;
      function Hash(value) {
        return hash_1.ValueHash.Create(value);
      }
      Value2.Hash = Hash;
      function Patch(current, edits) {
        return delta_1.ValueDelta.Patch(current, edits);
      }
      Value2.Patch = Patch;
      function Mutate(current, next) {
        mutate_1.ValueMutate.Mutate(current, next);
      }
      Value2.Mutate = Mutate;
    })(Value = exports2.Value || (exports2.Value = {}));
  }
});

// node_modules/@sinclair/typebox/value/index.js
var require_value2 = __commonJS({
  "node_modules/@sinclair/typebox/value/index.js"(exports2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __exportStar = exports2 && exports2.__exportStar || function(m, exports3) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports3, p)) __createBinding(exports3, m, p);
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.Delete = exports2.Update = exports2.Insert = exports2.Edit = exports2.ValueHash = exports2.ValueErrorType = exports2.ValueErrorIterator = void 0;
    var index_1 = require_errors2();
    Object.defineProperty(exports2, "ValueErrorIterator", { enumerable: true, get: function() {
      return index_1.ValueErrorIterator;
    } });
    Object.defineProperty(exports2, "ValueErrorType", { enumerable: true, get: function() {
      return index_1.ValueErrorType;
    } });
    var hash_1 = require_hash();
    Object.defineProperty(exports2, "ValueHash", { enumerable: true, get: function() {
      return hash_1.ValueHash;
    } });
    var delta_1 = require_delta();
    Object.defineProperty(exports2, "Edit", { enumerable: true, get: function() {
      return delta_1.Edit;
    } });
    Object.defineProperty(exports2, "Insert", { enumerable: true, get: function() {
      return delta_1.Insert;
    } });
    Object.defineProperty(exports2, "Update", { enumerable: true, get: function() {
      return delta_1.Update;
    } });
    Object.defineProperty(exports2, "Delete", { enumerable: true, get: function() {
      return delta_1.Delete;
    } });
    __exportStar(require_pointer(), exports2);
    __exportStar(require_value(), exports2);
  }
});

// src/index.js
var index_exports = {};
__export(index_exports, {
  default: () => nodox,
  validate: () => validate
});
module.exports = __toCommonJS(index_exports);
var import_path3 = __toESM(require("path"), 1);

// src/middleware/app-patcher.js
var ROUTE_METHODS = ["get", "post", "put", "delete", "del", "patch", "options", "head", "all"];
function patchApp(app, { onRouteRegistered: onRouteRegistered2, onUse } = {}) {
  const originalMethods = {};
  originalMethods.use = app.use.bind(app);
  app.use = function patchedUse(...args) {
    const result = originalMethods.use.apply(app, args);
    const _stack = (app._router || app.router)?.stack;
    if (_stack?.length) {
      const lastLayer = _stack[_stack.length - 1];
      const pathArg = typeof args[0] === "string" ? args[0] : null;
      if (pathArg && lastLayer && !lastLayer._nodoxPath) {
        lastLayer._nodoxPath = pathArg;
      }
      const fnArgs = args.filter((a) => a && typeof a === "function");
      for (const fn of fnArgs) {
        if (typeof fn.handle === "function" && typeof fn.set === "function") {
          if (lastLayer && !lastLayer._nodoxSubApp) {
            lastLayer._nodoxSubApp = fn;
          }
          break;
        }
      }
    }
    if (typeof onUse === "function") onUse();
    return result;
  };
  for (const method of ROUTE_METHODS) {
    if (typeof app[method] !== "function") continue;
    originalMethods[method] = app[method].bind(app);
    app[method] = function patchedMethod(path3, ...handlers) {
      const result = originalMethods[method].call(app, path3, ...handlers);
      if (typeof onRouteRegistered2 === "function") {
        onRouteRegistered2(method.toUpperCase(), path3, handlers);
      }
      return result;
    };
  }
  return function unpatch() {
    app.use = originalMethods.use;
    for (const method of ROUTE_METHODS) {
      if (originalMethods[method]) {
        app[method] = originalMethods[method];
      }
    }
  };
}

// src/extractor/route-extractor.js
var import_module = require("module");
var _require = (0, import_module.createRequire)(__importMetaUrl);
function getExpressVersion() {
  try {
    return _require("express/package.json").version || null;
  } catch {
    return null;
  }
}
function extractRoutes(app) {
  const routes = [];
  const router = _getRouter(app);
  if (!router) return routes;
  walkStack(router.stack, "", routes);
  const seen = /* @__PURE__ */ new Set();
  return routes.filter((r) => {
    const key = `${r.method}:${r.path}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
function _getRouter(app) {
  if (typeof app.lazyrouter === "function") {
    try {
      app.lazyrouter();
    } catch {
    }
  }
  if (app._router?.stack) return app._router;
  if (app.router?.stack) return app.router;
  return null;
}
function walkStack(stack, prefix, routes) {
  if (!Array.isArray(stack)) return;
  for (const layer of stack) {
    if (!layer) continue;
    if (layer.route) {
      extractFromRoute(layer.route, prefix, routes);
    } else {
      let childStack = layer.handle?.stack ?? null;
      if (!childStack && layer.handle) {
        if (typeof layer.handle.lazyrouter === "function") {
          try {
            layer.handle.lazyrouter();
          } catch {
          }
        }
        childStack = layer.handle._router?.stack ?? null;
      }
      if (!childStack && layer._nodoxSubApp) {
        const subApp = layer._nodoxSubApp;
        if (typeof subApp.lazyrouter === "function") {
          try {
            subApp.lazyrouter();
          } catch {
          }
        }
        childStack = subApp._router?.stack ?? null;
      }
      if (childStack) {
        const mountPath = extractMountPath(layer);
        walkStack(childStack, prefix + mountPath, routes);
      }
    }
  }
}
function extractMountPath(layer) {
  if (layer._nodoxPath) return layer._nodoxPath;
  if (!layer.regexp) {
    return layer.slash ? "" : "";
  }
  if (layer.regexp.fast_slash) return "";
  if (layer.regexp.fast_star) return "*";
  const src = layer.regexp.source;
  const match = src.match(/^\^\\\/(.+?)\\\/\?/);
  if (match) {
    return "/" + match[1].replace(/\\\//g, "/");
  }
  const matchGeneral = src.match(
    /^\^(?:\\\/|\/)((?:[a-zA-Z0-9\-_.~@%!$&'*+,;=:]+(?:(?:\\\/|\/)[a-zA-Z0-9\-_.~@%!$&'*+,;=:]+)*)?)(?:[^a-zA-Z0-9\-_.~@%!$&'*+,;=:\\/]|$)/
  );
  if (matchGeneral?.[1]) {
    return "/" + matchGeneral[1].replace(/\\\//g, "/");
  }
  return "";
}
function isWildcardPath(routePath) {
  if (!routePath) return true;
  if (routePath.startsWith("/__nodox")) return true;
  const catchAlls = ["*", "/*", "(.*)", "/(.*)"];
  return catchAlls.includes(routePath);
}
function extractFromRoute(route, prefix, routes) {
  const path3 = normalizePath(prefix + route.path);
  if (isWildcardPath(path3)) return;
  const middlewareNames = route.stack.map((l) => l.handle?.name || "anonymous").filter(Boolean);
  const handlers = route.stack.map((l) => l.handle).filter((h) => typeof h === "function");
  for (const layer of route.stack) {
    const method = layer.method?.toUpperCase();
    if (!method) continue;
    routes.push({
      method,
      path: path3,
      middlewareNames,
      handlers,
      hasValidator: false
      // Updated by schema detector in Phase 2
    });
  }
}
function normalizePath(path3) {
  return ("/" + path3).replace(/\/+/g, "/").replace(/\/$/, "") || "/";
}
function checkExpressCompatibility(app) {
  const version = getExpressVersion();
  const major = version ? parseInt(version.split(".")[0], 10) : null;
  if (major !== null && (major < 4 || major > 5)) {
    return {
      compatible: false,
      warning: `[nodox] Express ${version} is not supported. nodox requires Express 4.x or 5.x.`
    };
  }
  const isExpressApp = app != null && typeof app.use === "function" && typeof app.get === "function" && typeof app.listen === "function";
  if (!isExpressApp) {
    return {
      compatible: false,
      warning: "[nodox] The first argument to nodox() must be an Express app instance."
    };
  }
  if (typeof app.lazyrouter === "function") {
    try {
      app.lazyrouter();
    } catch {
    }
  }
  return { compatible: true, version: version || "unknown" };
}

// src/websocket/ws-server.js
var import_ws = require("ws");
var NodoxWebSocketServer = class {
  /** @type {WebSocketServer|null} */
  #wss = null;
  /** @type {Set<WebSocket>} */
  #clients = /* @__PURE__ */ new Set();
  /** @type {() => object} */
  #getState;
  /**
   * @param {object} options
   * @param {Function} options.getState - returns current full state object
   */
  constructor({ getState }) {
    this.#getState = getState;
  }
  /**
   * Attach the WebSocket server to an existing HTTP server.
   * @param {import('http').Server} httpServer
   */
  attach(httpServer) {
    this.#wss = new import_ws.WebSocketServer({
      noServer: true,
      // Only accept connections from the same host (localhost/127.0.0.1).
      // This blocks cross-origin reads from malicious third-party web pages
      // while still allowing the nodox UI served on the same server to connect.
      verifyClient({ origin, req }) {
        if (!origin) return true;
        try {
          const url = new URL(origin);
          const host = req.headers.host || "";
          if (url.host === host) return true;
          const hostname = url.hostname;
          if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1") return true;
          if (hostname.endsWith(".localhost")) return true;
          console.warn(`[nodox] WebSocket connection rejected from origin: ${origin} (server host: ${host})`);
          return false;
        } catch {
          return false;
        }
      }
    });
    httpServer.on("upgrade", (req, socket, head) => {
      const path3 = req.url.split("?")[0];
      if (path3 === "/__nodox_ws") {
        this.#wss.handleUpgrade(req, socket, head, (ws) => {
          this.#wss.emit("connection", ws, req);
        });
      }
    });
    this.#wss.on("connection", (ws) => {
      this.#clients.add(ws);
      this.#sendFullSync(ws);
      ws.on("message", (data) => {
        try {
          const msg = JSON.parse(data.toString());
          if (msg.type === "pong") return;
        } catch {
        }
      });
      ws.on("close", () => {
        this.#clients.delete(ws);
      });
      ws.on("error", (err) => {
        console.warn("[nodox] WebSocket client error:", err.message);
        this.#clients.delete(ws);
      });
    });
    this.#wss.on("error", (err) => {
      console.warn("[nodox] WebSocket server error:", err.message);
    });
    this.#startKeepalive();
    return this;
  }
  /**
   * Send full state to one specific client.
   * @param {WebSocket} ws
   */
  #sendFullSync(ws) {
    this.#send(ws, {
      type: "FULL_STATE_SYNC",
      ...this.#getState(),
      timestamp: Date.now()
    });
  }
  /**
   * Broadcast full state to ALL connected clients.
   * Called when routes change significantly (e.g. after deferred extraction).
   */
  broadcastFullSync() {
    const state = {
      type: "FULL_STATE_SYNC",
      ...this.#getState(),
      timestamp: Date.now()
    };
    for (const ws of this.#clients) {
      this.#send(ws, state);
    }
  }
  /**
   * Broadcast an incremental update to all clients.
   * @param {object} message
   */
  broadcast(message) {
    for (const ws of this.#clients) {
      this.#send(ws, message);
    }
  }
  /**
   * Safe JSON send — swallows errors on closed connections.
   * @param {WebSocket} ws
   * @param {object} data
   */
  #send(ws, data) {
    if (ws.readyState !== import_ws.WebSocket.OPEN) return;
    try {
      ws.send(JSON.stringify(data));
    } catch {
      this.#clients.delete(ws);
    }
  }
  #startKeepalive() {
    const interval = setInterval(() => {
      for (const ws of this.#clients) {
        if (ws.readyState === import_ws.WebSocket.OPEN) {
          this.#send(ws, { type: "ping" });
        } else {
          this.#clients.delete(ws);
        }
      }
    }, 3e4);
    interval.unref?.();
  }
  /**
   * Gracefully close the WebSocket server.
   */
  close() {
    for (const ws of this.#clients) {
      try {
        ws.close();
      } catch {
      }
    }
    this.#clients.clear();
    this.#wss?.close();
  }
  get clientCount() {
    return this.#clients.size;
  }
};

// src/ui-server/ui-server.js
var import_path = __toESM(require("path"), 1);
var import_fs = __toESM(require("fs"), 1);
var import_url = require("url");
var import_module2 = require("module");
var __dirname = import_path.default.dirname((0, import_url.fileURLToPath)(__importMetaUrl));
var _require2 = (0, import_module2.createRequire)(__importMetaUrl);
function _getExpressMajor(app) {
  if (app && typeof app.lazyrouter !== "function") return 5;
  return 4;
}
function findUiDir() {
  const candidates = [
    // Installed from npm, CJS bundle: __dirname = nodox-cli/dist/
    import_path.default.resolve(__dirname, "../ui/dist"),
    // Installed from npm, ESM source: __dirname = nodox-cli/src/ui-server/
    import_path.default.resolve(__dirname, "../../ui/dist"),
    // Running from source
    import_path.default.resolve(__dirname, "./ui"),
    import_path.default.resolve(__dirname, "../ui"),
    import_path.default.resolve(__dirname, "../../dist/ui")
  ];
  for (const candidate of candidates) {
    if (import_fs.default.existsSync(import_path.default.join(candidate, "index.html"))) {
      return candidate;
    }
  }
  return null;
}
function createUiHandler({ uiPath = "/__nodox", getState, info } = {}) {
  const uiDir = findUiDir();
  const assetsPrefix = `${uiPath}/assets`;
  const openApiPath = `${uiPath}/openapi.json`;
  const openApiYamlPath = `${uiPath}/openapi.yaml`;
  const statusPath = `${uiPath}/status.json`;
  return function uiHandler(req, res, next) {
    if (!req.path.startsWith(uiPath)) {
      return next();
    }
    _applySecurityHeaders(res);
    if (req.path === openApiPath) {
      const state = typeof getState === "function" ? getState() : { routes: [] };
      const spec = buildOpenApiSpec(state.routes, req, { info });
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Access-Control-Allow-Origin", "*");
      return res.json(spec);
    }
    if (req.path === openApiYamlPath) {
      const state = typeof getState === "function" ? getState() : { routes: [] };
      const spec = buildOpenApiSpec(state.routes, req, { info });
      res.setHeader("Content-Type", "application/x-yaml");
      res.setHeader("Access-Control-Allow-Origin", "*");
      return res.send(_toYaml(spec));
    }
    if (req.path === statusPath) {
      const state = typeof getState === "function" ? getState() : { routes: [] };
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Access-Control-Allow-Origin", "*");
      return res.json(_buildStatusPayload(state.routes));
    }
    if (!uiDir) {
      res.setHeader("Content-Type", "text/html");
      res.send(_notBuiltHtml(uiPath));
      return;
    }
    if (req.path.startsWith(assetsPrefix)) {
      const filename = req.path.slice(assetsPrefix.length).replace(/^\//, "");
      const assetsDir = import_path.default.join(uiDir, "assets");
      const filePath = import_path.default.resolve(assetsDir, filename);
      if (!filePath.startsWith(assetsDir + import_path.default.sep) && filePath !== assetsDir) {
        res.status(403).end();
        return;
      }
      if (!import_fs.default.existsSync(filePath)) {
        return next();
      }
      _sendAsset(res, filePath);
    } else {
      _serveIndexHtml(res, uiDir, uiPath);
    }
  };
}
function attachUiRoutes(app, { uiPath = "/__nodox", getState, info } = {}) {
  const uiDir = findUiDir();
  app.get(`${uiPath}/openapi.json`, (req, res) => {
    _applySecurityHeaders(res);
    const state = typeof getState === "function" ? getState() : { routes: [] };
    const spec = buildOpenApiSpec(state.routes, req, { info });
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.json(spec);
  });
  app.get(`${uiPath}/openapi.yaml`, (req, res) => {
    _applySecurityHeaders(res);
    const state = typeof getState === "function" ? getState() : { routes: [] };
    const spec = buildOpenApiSpec(state.routes, req, { info });
    res.setHeader("Content-Type", "application/x-yaml");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.send(_toYaml(spec));
  });
  app.get(`${uiPath}/status.json`, (req, res) => {
    _applySecurityHeaders(res);
    const state = typeof getState === "function" ? getState() : { routes: [] };
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.json(_buildStatusPayload(state.routes));
  });
  if (!uiDir) {
    _registerCatchAll(app, uiPath, (req, res) => {
      _applySecurityHeaders(res);
      res.send(_notBuiltHtml(uiPath));
    });
    return;
  }
  app.use(`${uiPath}/assets`, (req, res, next) => {
    _applySecurityHeaders(res);
    createStaticHandler(import_path.default.join(uiDir, "assets"))(req, res, next);
  });
  _registerCatchAll(app, uiPath, (req, res) => {
    _applySecurityHeaders(res);
    _serveIndexHtml(res, uiDir, uiPath);
  });
}
var _indexHtmlCache = /* @__PURE__ */ new Map();
function _serveIndexHtml(res, uiDir, uiPath) {
  let html = _indexHtmlCache.get(uiPath);
  if (!html) {
    html = import_fs.default.readFileSync(import_path.default.join(uiDir, "index.html"), "utf8");
    if (uiPath !== "/__nodox") {
      html = html.replaceAll("/__nodox/", `${uiPath}/`);
    }
    _indexHtmlCache.set(uiPath, html);
  }
  res.setHeader("Content-Type", "text/html");
  res.setHeader("Cache-Control", "no-cache");
  res.send(html);
}
function _applySecurityHeaders(res) {
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; connect-src 'self' ws: wss: http: https:; img-src 'self' data: blob:; font-src 'self' data: https://fonts.gstatic.com; frame-ancestors 'none'"
  );
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "same-origin");
}
function _escapeHtml(str) {
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function _notBuiltHtml(uiPath) {
  const safeUiPath = _escapeHtml(uiPath);
  return `<!DOCTYPE html><html><head><title>nodox \u2014 UI not built</title>
  <style>body{font-family:monospace;padding:40px;background:#0a0a0a;color:#888}h1{color:#fff}
  code{background:#1a1a1a;padding:4px 8px;border-radius:4px;color:#7dd3fc}</style></head>
  <body><h1>nodox</h1>
  <p>UI bundle not found. Run <code>npm run build:ui</code> to build the interface.</p>
  <p>Then open <code>${safeUiPath}</code></p></body></html>`;
}
var MIME_TYPES = {
  ".js": "application/javascript",
  ".css": "text/css",
  ".html": "text/html",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".woff": "font/woff"
};
function _sendAsset(res, filePath) {
  const ext = import_path.default.extname(filePath);
  const filename = import_path.default.basename(filePath);
  res.setHeader("Content-Type", MIME_TYPES[ext] || "application/octet-stream");
  if (filename.match(/\.[a-f0-9]{8,}\./)) {
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  } else {
    res.setHeader("Cache-Control", "no-cache");
  }
  res.sendFile(filePath);
}
function _registerCatchAll(app, uiPath, handler) {
  const major = _getExpressMajor(app);
  if (major >= 5) {
    app.get(uiPath, handler);
    app.get(`${uiPath}/*path`, handler);
  } else {
    app.get(`${uiPath}*`, handler);
  }
}
function createStaticHandler(dir) {
  return (req, res, next) => {
    const filename = req.path.replace(/^\/+/, "");
    const filePath = import_path.default.resolve(dir, filename);
    if (!filePath.startsWith(dir + import_path.default.sep) && filePath !== dir) {
      return res.status(403).end();
    }
    if (!import_fs.default.existsSync(filePath)) {
      return next();
    }
    _sendAsset(res, filePath);
  };
}
function _toYaml(value, indent = 0) {
  const pad = "  ".repeat(indent);
  if (value === null || value === void 0) return "null";
  if (typeof value === "boolean") return String(value);
  if (typeof value === "number") return isFinite(value) ? String(value) : "null";
  if (typeof value === "string") return _yamlStr(value);
  if (Array.isArray(value)) {
    if (value.length === 0) return "[]";
    return value.map((item) => {
      const rendered = _toYaml(item, indent + 1);
      const isBlock = typeof item === "object" && item !== null && !Array.isArray(item) && Object.keys(item).length > 0;
      return isBlock ? `${pad}-
${rendered}` : `${pad}- ${rendered}`;
    }).join("\n");
  }
  const entries = Object.entries(value);
  if (entries.length === 0) return "{}";
  return entries.map(([k, v]) => {
    const key = /^[a-zA-Z0-9_$][a-zA-Z0-9_$/-]*$/.test(k) ? k : `"${k.replace(/"/g, '\\"')}"`;
    if (v === null || v === void 0) return `${pad}${key}: null`;
    if (typeof v === "object") {
      const rendered = _toYaml(v, indent + 1);
      if (rendered === "[]" || rendered === "{}") return `${pad}${key}: ${rendered}`;
      return `${pad}${key}:
${rendered}`;
    }
    return `${pad}${key}: ${_toYaml(v, indent + 1)}`;
  }).join("\n");
}
function _yamlStr(s) {
  if (s === "") return '""';
  const needsQuote = /[:#{}[\]|>&*!,'"@`]/.test(s) || /^(true|false|null|yes|no|on|off|\d)/.test(s) || s.startsWith(" ") || s.endsWith(" ") || s.includes("\n");
  return needsQuote ? JSON.stringify(s) : s;
}
function _buildStatusPayload(routes) {
  const items = (routes || []).filter((r) => r.path && !r.path.startsWith("/__nodox")).map((r) => ({
    method: r.method,
    path: r.path,
    inputConfidence: r.schema?.inputConfidence ?? "none",
    outputConfidence: r.schema?.outputConfidence ?? "none",
    tags: r.schema?.tags ?? null
  }));
  return { routes: items, generatedAt: (/* @__PURE__ */ new Date()).toISOString() };
}
var _BODY_METHODS = /* @__PURE__ */ new Set(["post", "put", "patch"]);
var _PARAM_RE = /:([a-zA-Z_][a-zA-Z0-9_]*)/g;
function _schemaName(method, path3, suffix) {
  const parts = [method.charAt(0).toUpperCase() + method.slice(1).toLowerCase()];
  for (const seg of path3.split("/").filter(Boolean)) {
    if (seg.startsWith(":")) {
      parts.push("By" + seg.charAt(1).toUpperCase() + seg.slice(2));
    } else {
      parts.push(seg.charAt(0).toUpperCase() + seg.slice(1).replace(/[^a-zA-Z0-9]/g, ""));
    }
  }
  return parts.join("") + suffix;
}
function _fingerprint(schema) {
  try {
    const seen = /* @__PURE__ */ new WeakSet();
    return JSON.stringify(schema, (_, v) => {
      if (v && typeof v === "object" && !Array.isArray(v)) {
        if (seen.has(v)) return "[Circular]";
        seen.add(v);
        return Object.fromEntries(Object.keys(v).sort().map((k) => [k, v[k]]));
      }
      return v;
    });
  } catch {
    return null;
  }
}
function _isComplex(schema) {
  return schema && typeof schema === "object" && (schema.properties || schema.items?.properties || schema.anyOf?.length || schema.oneOf?.length || schema.allOf?.length);
}
function _asRef(schema, proposedName, components, fingerprints) {
  if (!_isComplex(schema)) return schema;
  const fp = _fingerprint(schema);
  if (fp && fingerprints.has(fp)) {
    return { "$ref": `#/components/schemas/${fingerprints.get(fp)}` };
  }
  let name = proposedName;
  let counter = 2;
  while (components[name]) {
    name = proposedName + counter++;
  }
  components[name] = schema;
  if (fp) fingerprints.set(fp, name);
  return { "$ref": `#/components/schemas/${name}` };
}
function buildOpenApiSpec(routes, req, { info } = {}) {
  const host = req?.headers?.host || "localhost";
  const isHttps = req?.connection?.encrypted || req?.headers?.["x-forwarded-proto"] === "https";
  const protocol = isHttps ? "https" : "http";
  const paths = {};
  const securitySchemes = {};
  const schemaComponents = {};
  const schemaFingerprints = /* @__PURE__ */ new Map();
  for (const route of routes || []) {
    if (!route.path || route.path.startsWith("/__nodox")) continue;
    const openApiPath = route.path.replace(_PARAM_RE, "{$1}");
    if (!paths[openApiPath]) paths[openApiPath] = {};
    const method = route.method.toLowerCase();
    const schema = route.schema;
    const operation = {};
    if (schema?.tags?.length) {
      operation.tags = schema.tags;
    } else if (route.version) {
      operation.tags = [route.version];
    }
    if (schema?.meta?.summary) operation.summary = schema.meta.summary;
    if (schema?.meta?.description) operation.description = schema.meta.description;
    if (schema?.meta?.deprecated === true) operation.deprecated = true;
    if (schema?.externalDocs?.url) operation.externalDocs = schema.externalDocs;
    const pathParams = [];
    _PARAM_RE.lastIndex = 0;
    let m;
    while ((m = _PARAM_RE.exec(route.path)) !== null) {
      pathParams.push({ name: m[1], in: "path", required: true, schema: { type: "string" } });
    }
    const queryParams = [];
    if (schema?.querySchema?.properties) {
      for (const [name, def] of Object.entries(schema.querySchema.properties)) {
        queryParams.push({ name, in: "query", required: false, schema: def });
      }
    }
    const parameters = [...pathParams, ...queryParams];
    if (parameters.length) operation.parameters = parameters;
    if (_BODY_METHODS.has(method) && schema?.input) {
      const bodyRef = _asRef(
        schema.input,
        _schemaName(method, route.path, "Body"),
        schemaComponents,
        schemaFingerprints
      );
      const bodyContent = { schema: bodyRef };
      if (schema?.meta?.examples?.body) {
        bodyContent.examples = { default: { value: schema.meta.examples.body } };
      }
      operation.requestBody = {
        required: true,
        content: { "application/json": bodyContent }
      };
    }
    const responses = {};
    if (schema?.outputByStatus) {
      for (const [statusCode, resSchema] of Object.entries(schema.outputByStatus)) {
        const resRef = _asRef(
          resSchema,
          _schemaName(method, route.path, `Response${statusCode}`),
          schemaComponents,
          schemaFingerprints
        );
        const resContent = { schema: resRef };
        if (schema?.meta?.examples?.responses?.[statusCode]) {
          resContent.examples = { default: { value: schema.meta.examples.responses[statusCode] } };
        }
        responses[statusCode] = {
          description: _httpStatusDescription(Number(statusCode)),
          content: { "application/json": resContent }
        };
      }
    }
    if (schema?.output && !responses["200"]) {
      const resRef = _asRef(
        schema.output,
        _schemaName(method, route.path, "Response"),
        schemaComponents,
        schemaFingerprints
      );
      const resContent = { schema: resRef };
      if (schema?.meta?.examples?.response) {
        resContent.examples = { default: { value: schema.meta.examples.response } };
      }
      responses["200"] = {
        description: "Success",
        content: { "application/json": resContent }
      };
    }
    if (Object.keys(responses).length === 0) {
      responses["200"] = { description: "Success" };
    }
    operation.responses = responses;
    if (schema?.auth) {
      const schemeResult = _buildSecurityScheme(schema.auth);
      if (schemeResult) {
        const [schemeName, schemeObj] = schemeResult;
        securitySchemes[schemeName] = schemeObj;
        const scopes = schema.auth.type === "oauth2" ? schema.auth.scopes || [] : [];
        operation.security = [{ [schemeName]: scopes }];
      }
    }
    paths[openApiPath][method] = operation;
  }
  const specInfo = {
    title: info?.title || "API",
    version: info?.version || "1.0.0",
    ...info?.description ? { description: info.description } : {},
    ...info?.contact ? { contact: info.contact } : {},
    ...info?.license ? { license: info.license } : {},
    ...info?.termsOfService ? { termsOfService: info.termsOfService } : {}
  };
  const spec = {
    openapi: "3.1.0",
    info: specInfo,
    servers: [{ url: `${protocol}://${host}` }],
    paths
  };
  const hasSchemaComponents = Object.keys(schemaComponents).length > 0;
  const hasSecuritySchemes = Object.keys(securitySchemes).length > 0;
  if (hasSchemaComponents || hasSecuritySchemes) {
    spec.components = {};
    if (hasSchemaComponents) spec.components.schemas = schemaComponents;
    if (hasSecuritySchemes) spec.components.securitySchemes = securitySchemes;
  }
  return spec;
}
function _buildSecurityScheme(auth) {
  const desc = auth.description ? { description: auth.description } : {};
  switch (auth.type) {
    case "bearer":
      return ["BearerAuth", { type: "http", scheme: "bearer", bearerFormat: "JWT", ...desc }];
    case "basic":
      return ["BasicAuth", { type: "http", scheme: "basic", ...desc }];
    case "apiKey":
      return ["ApiKeyAuth", { type: "apiKey", name: auth.name || "X-API-Key", in: auth.in || "header", ...desc }];
    case "oauth2":
      return ["OAuth2Auth", {
        type: "oauth2",
        flows: {
          implicit: {
            authorizationUrl: "",
            scopes: Object.fromEntries((auth.scopes || []).map((s) => [s, ""]))
          }
        },
        ...desc
      }];
    default:
      return null;
  }
}
function _httpStatusDescription(code) {
  const map = {
    200: "OK",
    201: "Created",
    202: "Accepted",
    204: "No Content",
    301: "Moved Permanently",
    302: "Found",
    304: "Not Modified",
    400: "Bad Request",
    401: "Unauthorized",
    403: "Forbidden",
    404: "Not Found",
    405: "Method Not Allowed",
    409: "Conflict",
    410: "Gone",
    422: "Unprocessable Entity",
    429: "Too Many Requests",
    500: "Internal Server Error",
    502: "Bad Gateway",
    503: "Service Unavailable"
  };
  return map[code] || "Response";
}

// src/schema/response-interceptor.js
function inferShape(value, depth = 0) {
  if (depth > 8) return { type: "object", description: "(depth limit)" };
  if (value === null) return { type: "null" };
  if (value === void 0) return { type: "null" };
  if (value instanceof Date) return { type: "string", format: "date-time" };
  const type = typeof value;
  if (type === "boolean") return { type: "boolean" };
  if (type === "number") {
    return Number.isInteger(value) ? { type: "integer" } : { type: "number" };
  }
  if (type === "string") {
    if (/^\d{4}-\d{2}-\d{2}T/.test(value)) return { type: "string", format: "date-time" };
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return { type: "string", format: "date" };
    if (/^[a-f0-9-]{36}$/i.test(value)) return { type: "string", format: "uuid" };
    if (/^https?:\/\//.test(value)) return { type: "string", format: "uri" };
    return { type: "string" };
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return { type: "array", items: {} };
    const itemShape = inferShape(value[0], depth + 1);
    if (value.length > 1) {
      const secondShape = inferShape(value[1], depth + 1);
      return { type: "array", items: mergeShapes(itemShape, secondShape) };
    }
    return { type: "array", items: itemShape };
  }
  if (type === "object") {
    const properties = {};
    const keys = Object.keys(value);
    const limitedKeys = keys.slice(0, 50);
    for (const key of limitedKeys) {
      properties[key] = inferShape(value[key], depth + 1);
    }
    const result = { type: "object", properties };
    if (keys.length > 50) {
      result.description = `(showing 50 of ${keys.length} fields)`;
    }
    return result;
  }
  return { type: "any" };
}
function mergeShapes(a, b) {
  if (!a) return b;
  if (!b) return a;
  if (a.type !== b.type && a.type && b.type) {
    if (a.type === "integer" && b.type === "number" || a.type === "number" && b.type === "integer") {
      return { type: "number" };
    }
    return { anyOf: [a, b] };
  }
  if (a.type === "object" && b.type === "object") {
    const allKeys = /* @__PURE__ */ new Set([
      ...Object.keys(a.properties || {}),
      ...Object.keys(b.properties || {})
    ]);
    const properties = {};
    for (const key of allKeys) {
      if (a.properties?.[key] && b.properties?.[key]) {
        properties[key] = mergeShapes(a.properties[key], b.properties[key]);
      } else {
        properties[key] = a.properties?.[key] || b.properties?.[key];
      }
    }
    return { type: "object", properties };
  }
  if (a.type === "array" && b.type === "array") {
    return {
      type: "array",
      items: mergeShapes(a.items, b.items)
    };
  }
  if (a.type === b.type) {
    if (a.format !== b.format) {
      const merged = { ...a };
      delete merged.format;
      return merged;
    }
    return a;
  }
  return a;
}
function isWildcardRoute(path3) {
  if (!path3) return true;
  return path3 === "*" || path3 === "/*" || path3.startsWith("/__nodox") || path3 === "/favicon.ico" || /\*/.test(path3);
}
var BODY_METHODS = /* @__PURE__ */ new Set(["POST", "PUT", "PATCH"]);
var QUERY_METHODS = /* @__PURE__ */ new Set(["GET", "DELETE", "HEAD", "OPTIONS"]);
function createResponseInterceptor({ onResponseShape, parsedValueToSchema: parsedValueToSchema2, onRequestBodyShape, onRequestQueryShape }) {
  return function responseInterceptorMiddleware(req, res, next) {
    const originalJson = res.json.bind(res);
    res.json = function interceptedJson(body) {
      const routePath = req.route ? ((req.baseUrl || "") + req.route.path).replace(/\/+/g, "/").replace(/\/$/, "") || "/" : null;
      if (routePath && !isWildcardRoute(routePath)) {
        const method = req.method?.toUpperCase() ?? "";
        if (typeof onRequestBodyShape === "function" && BODY_METHODS.has(method) && req.body !== null && req.body !== void 0 && typeof req.body === "object" && Object.keys(req.body).length > 0) {
          try {
            onRequestBodyShape(method, routePath, inferShape(req.body));
          } catch {
          }
        }
        if (typeof onRequestQueryShape === "function" && QUERY_METHODS.has(method) && req.query !== null && req.query !== void 0 && typeof req.query === "object" && Object.keys(req.query).length > 0) {
          try {
            onRequestQueryShape(method, routePath, inferShape(req.query));
          } catch {
          }
        }
        if (body !== void 0) {
          try {
            let shape, confidence;
            if (parsedValueToSchema2 && body !== null && typeof body === "object") {
              const knownSchema = parsedValueToSchema2.get(body);
              if (knownSchema) {
                shape = knownSchema;
                confidence = "inferred";
              }
            }
            if (!shape) {
              shape = inferShape(body);
              confidence = "observed";
            }
            onResponseShape(method, routePath, shape, confidence);
          } catch {
          }
        }
      }
      return originalJson(body);
    };
    next();
  };
}

// src/schema/source-screener.js
var ZOD_PATTERNS = [
  /\.safeParse\(/,
  /\.parseAsync\(/,
  /\.safeParseAsync\(/,
  /\bz\.(object|string|number|boolean|array|union|enum)\b/,
  /_zod\.z\./,
  // transpiled: import * as _zod from 'zod'
  /zod_1\.z\./,
  // commonjs transpiled by tsc
  /[a-zA-Z]{2,}\.parse\(/,
  // Catch anyVariable.parse() — excludes single-char (valibot's v.parse)
  /[a-zA-Z]{2,}\.safeParse\(/,
  // Catch anyVariable.safeParse() — excludes single-char
  // Catch any variableName.parse(req.*) — the most common validation pattern.
  /\.parse\(req[.,\s)]/,
  /\w+[Ss]chema\.parse\(/,
  /\w+[Vv]alidator\.parse\(/
];
var JOI_PATTERNS = [
  /\.validate\(req\b/,
  /\.validate\(\w+\.body\b/,
  // Catch schema.validate(req.body)
  /joi\.(object|string|number|boolean|array)\(/,
  /_joi\.(default|joi)\b/i,
  /Joi\.(object|string|number|boolean|array)\(/
];
var YUP_PATTERNS = [
  /yup\.(object|string|number|boolean|array|mixed)\(/,
  /\.validateSync\(req\b/,
  /\.validateSync\(req\.body\b/,
  /yup_1\.(object|string|number|boolean)/,
  // tsc-transpiled yup
  /schema\.validateSync\b/
];
var VALIBOT_PATTERNS = [];
var TYPEBOX_PATTERNS = [];
var KNOWN_NON_VALIDATORS = /* @__PURE__ */ new Set([
  // Express built-ins and internal names
  "router",
  "bound dispatch",
  "bound ",
  "jsonParser",
  "urlencodedParser",
  "rawParser",
  "textParser",
  "json",
  "urlencoded",
  "raw",
  "text",
  "query",
  "init",
  "expressInit",
  // nodox's own middleware
  "nodoxMiddleware",
  "nodoxValidateMiddleware",
  "responseInterceptorMiddleware",
  "uiHandler",
  // Security & utility middleware
  "corsMiddleware",
  "cors",
  "corsPreflight",
  "helmet",
  "morgan",
  "logger",
  "accessLogger",
  "requestLogger",
  "compression",
  "responseTime",
  "timeout",
  "connectTimeout",
  "methodOverride",
  // Rate limiting
  "rateLimit",
  "slowDown",
  "expressRateLimit",
  // Auth & sessions
  "session",
  "expressSession",
  "cookieParser",
  "cookieSession",
  "passport",
  "initialize",
  "passportInitialize",
  "passportSession",
  "authenticate",
  "jwtMiddleware",
  "bearerStrategy",
  // File upload
  "multer",
  "upload",
  "single",
  "array",
  "fields",
  "none",
  "any",
  "busboy",
  "multipart",
  // Caching
  "cache",
  "apicache",
  "expressCache",
  // Body parsing
  "bodyParser",
  // Static file serving
  "serveStatic",
  "staticMiddleware",
  "sendFile",
  // Error handling
  "errorHandler",
  "notFound",
  "notFoundHandler",
  "finalhandler",
  // Validation frameworks (not the user's validators — these are factory wrappers)
  "checkSchema",
  "check",
  "param",
  "query",
  "header",
  "cookie",
  "validationResult",
  // Logging
  "pinoHttp",
  "winstonMiddleware",
  // Misc popular middleware
  "device",
  "userAgent",
  "responseCompression",
  "requestId",
  "correlationId",
  "i18n",
  "locale"
]);
var NODE_MODULES_SOURCE_PATTERNS = [
  /Object\.defineProperty\(exports,\s*["']__esModule["']/,
  // TypeScript/Babel CJS
  /exports\.__esModule\s*=\s*true/,
  // TS simple CJS interop
  /__webpack_require__\(/,
  // Webpack bundle
  /\/\*\*\s*@license\b/,
  // License JSDoc comment
  /\/\*\s*!\s*Copyright\s/i,
  // Minified copyright comment
  /function\s*\(\s*module\s*,\s*exports\s*,\s*__webpack/
  // Webpack factory
];
function isLikelyNodeModuleCode(src) {
  return NODE_MODULES_SOURCE_PATTERNS.some((p) => p.test(src));
}
function looksLikeValidator(fn) {
  if (typeof fn !== "function") return false;
  const name = fn.name || "";
  if (KNOWN_NON_VALIDATORS.has(name)) return false;
  if (fn.__isNodoxValidate) return false;
  let src;
  try {
    src = fn.toString();
  } catch {
    return false;
  }
  if (src.length < 20) return false;
  if (src.length > 500 && !src.includes("\n") && !src.includes("  ")) {
    return false;
  }
  if (isLikelyNodeModuleCode(src)) return false;
  const compressed = src.replace(/\s+/g, "");
  return ZOD_PATTERNS.some((p) => p.test(compressed)) || JOI_PATTERNS.some((p) => p.test(compressed)) || YUP_PATTERNS.some((p) => p.test(compressed)) || VALIBOT_PATTERNS.some((p) => p.test(compressed)) || TYPEBOX_PATTERNS.some((p) => p.test(compressed));
}

// src/schema/dry-runner.js
var import_async_hooks = require("async_hooks");
var import_http = __toESM(require("http"), 1);
var import_https = __toESM(require("https"), 1);
var import_net = __toESM(require("net"), 1);
var import_fs2 = __toESM(require("fs"), 1);
var import_child_process = __toESM(require("child_process"), 1);

// src/schema/schema-patcher.js
var import_module3 = require("module");
var require2 = (0, import_module3.createRequire)(__importMetaUrl);
var capturedSchemas = /* @__PURE__ */ new WeakMap();

// src/schema/dry-runner.js
var dryRunContext = new import_async_hooks.AsyncLocalStorage();
var ABORT_ERROR_MESSAGE = "__NODOC_DRY_RUN_ABORT__";
function isDryRun() {
  return dryRunContext.getStore()?.active === true;
}
function markSchemaDetectedInDryRun(schema, library) {
  const store = dryRunContext.getStore();
  if (store?.active && !store.protoDetectedSchema) {
    store.protoDetectedSchema = schema;
    store.protoDetectedLibrary = library;
  }
}
var _sideEffectPatchesApplied = false;
function applySideEffectPatches() {
  if (_sideEffectPatchesApplied) return;
  _sideEffectPatchesApplied = true;
  const patchNetwork = (mod) => {
    const orig = mod.request;
    mod.request = function(...args) {
      if (isDryRun()) {
        const err = new Error("Network call blocked during nodox dry-run");
        err.code = "ENETBLOCK";
        throw err;
      }
      return orig.apply(this, args);
    };
  };
  patchNetwork(import_http.default);
  patchNetwork(import_https.default);
  const origConnect = import_net.default.Socket.prototype.connect;
  import_net.default.Socket.prototype.connect = function(...args) {
    if (isDryRun()) {
      process.nextTick(() =>
        this.destroy(Object.assign(
          new Error("Network connection blocked during nodox dry-run"),
          { code: "ENETBLOCK" }
        ))
      );
      return this;
    }
    return origConnect.apply(this, args);
  };
  const blockFs = (method) => {
    const orig = import_fs2.default[method];
    if (typeof orig !== "function") return;
    const patched = function(...args) {
      if (isDryRun()) {
        throw new Error(`fs.${method} blocked during nodox dry-run`);
      }
      return orig.apply(this, args);
    };
    import_fs2.default[method] = patched;
    if (import_fs2.default.default && import_fs2.default.default[method]) {
      import_fs2.default.default[method] = patched;
    }
  };
  ["writeFile", "writeFileSync", "appendFile", "appendFileSync", "mkdir", "mkdirSync"].forEach(blockFs);
  const blockCp = (method) => {
    const orig = import_child_process.default[method];
    if (typeof orig !== "function") return;
    import_child_process.default[method] = function(...args) {
      if (isDryRun()) {
        throw new Error(`child_process.${method} blocked during nodox dry-run`);
      }
      return orig.apply(this, args);
    };
  };
  ["spawn", "spawnSync", "exec", "execSync", "execFile", "execFileSync", "fork"].forEach(blockCp);
}
function createInfiniteProxy(overrides = {}) {
  function handler(target2) {
    return {
      get(obj, prop) {
        if (prop in overrides) return overrides[prop];
        if (typeof prop === "symbol") return void 0;
        if (prop === "then" || prop === "catch" || prop === "finally") return void 0;
        if (prop === "toJSON") return void 0;
        if (prop === "valueOf") return () => null;
        if (prop === "toString") return () => "[nodox mock]";
        if (prop === "constructor") return Object;
        if (prop in obj) return obj[prop];
        return createInfiniteProxy();
      },
      apply() {
        return createInfiniteProxy();
      },
      set() {
        return true;
      }
    };
  }
  const target = typeof overrides === "function" ? overrides : function() {
  };
  return new Proxy(target, handler(target));
}
function createNullProbeBody() {
  return new Proxy({}, {
    get(_, prop) {
      if (typeof prop === "symbol") return void 0;
      if (prop === "then" || prop === "catch" || prop === "finally") return void 0;
      if (prop === "toJSON" || prop === "valueOf" || prop === "toString") return void 0;
      if (prop === "constructor") return Object;
      return null;
    },
    has(_, prop) {
      return typeof prop === "string";
    }
  });
}
async function dryRunValidator(fn, method = "POST", bodyOverride = void 0) {
  applySideEffectPatches();
  const mockReq = createInfiniteProxy({
    body: bodyOverride !== void 0 ? bodyOverride : {},
    params: {},
    query: {},
    // Return real empty objects for cookie/session/locals so property access
    // produces undefined instead of a truthy proxy. Without this, patterns like
    // `if (!req.cookies?.refresh_token) schema.parse(req.body)` never reach
    // parse() because the proxy is always truthy.
    cookies: {},
    session: {},
    locals: {},
    headers: {
      "content-type": "application/json",
      "accept": "application/json"
    },
    method: method.toUpperCase(),
    path: "/",
    url: "/",
    get(header) {
      return { "content-type": "application/json" }[header.toLowerCase()] || null;
    }
  });
  const _capturedJsonBodies = [];
  const _captureBody = (body) => {
    try {
      _capturedJsonBodies.push(body);
    } catch {
    }
  };
  const _statusResult = createInfiniteProxy({ json: _captureBody, send: _captureBody });
  const mockRes = createInfiniteProxy({
    json: _captureBody,
    send: _captureBody,
    status: () => _statusResult
  });
  const mockNext = (err) => {
    if (!caughtZodError && Array.isArray(err?.issues) && err.issues.length > 0) {
      caughtZodError = err;
    }
  };
  let detectedSchema = null;
  let detectedLibrary = null;
  let caughtZodError = null;
  let _protoDetectedSchema = null;
  let _protoDetectedLibrary = null;
  const patchedSchemas = /* @__PURE__ */ new Map();
  const schemasToWatch = getWatchableSchemas();
  for (const { schema, meta } of schemasToWatch) {
    const patches = patchSchemaForDryRun(schema, meta, (s, lib) => {
      if (!detectedSchema) {
        detectedSchema = s;
        detectedLibrary = lib;
      }
    });
    if (patches) patchedSchemas.set(schema, patches);
  }
  try {
    await dryRunContext.run({ active: true, protoDetectedSchema: null, protoDetectedLibrary: null }, async () => {
      const maybePromise = fn(mockReq, mockRes, mockNext);
      if (maybePromise && typeof maybePromise.then === "function") {
        await new Promise((resolve) => {
          const t = setTimeout(resolve, 0);
          maybePromise.then(
            () => {
              clearTimeout(t);
              resolve();
            },
            (err) => {
              clearTimeout(t);
              if (!caughtZodError && Array.isArray(err?.issues) && err.issues.length > 0) {
                caughtZodError = err;
              }
              resolve();
            }
          );
        });
      }
      const store = dryRunContext.getStore();
      _protoDetectedSchema = store?.protoDetectedSchema ?? null;
      _protoDetectedLibrary = store?.protoDetectedLibrary ?? null;
    });
  } catch (err) {
    if (err.message === ABORT_ERROR_MESSAGE) {
    } else if (!detectedSchema && Array.isArray(err?.issues) && err.issues.length > 0) {
      caughtZodError = err;
    }
  }
  for (const [schema, patches] of patchedSchemas) {
    for (const [method2, original] of Object.entries(patches)) {
      try {
        schema[method2] = original;
      } catch {
      }
    }
  }
  if (!detectedSchema && !caughtZodError) {
    for (const body of _capturedJsonBodies) {
      const issues = _extractZodIssues(body);
      if (issues) {
        caughtZodError = { issues };
        break;
      }
    }
  }
  if (!detectedSchema && _protoDetectedSchema) {
    detectedSchema = _protoDetectedSchema;
    detectedLibrary = _protoDetectedLibrary || "zod";
  }
  return {
    schema: detectedSchema,
    library: detectedLibrary,
    zodError: caughtZodError,
    jsonSchema: null
    // Converted by schema-detector after dry run
  };
}
function _extractZodIssues(body) {
  if (!body || typeof body !== "object") return null;
  const candidates = [
    body.issues,
    body.details,
    body.errors,
    body.validationErrors,
    body.error?.issues
  ];
  for (const c of candidates) {
    if (Array.isArray(c) && c.length > 0 && Array.isArray(c[0]?.path) && typeof c[0]?.code === "string") {
      return c;
    }
  }
  return null;
}
function patchSchemaForDryRun(schema, meta, onDetected) {
  const originals = {};
  const methodsToWatch = meta.type === "zod" ? ["parse", "safeParse", "parseAsync", "safeParseAsync"] : meta.type === "yup" ? ["validateSync"] : ["validate", "validateAsync"];
  let patched = false;
  for (const method of methodsToWatch) {
    if (typeof schema[method] !== "function") continue;
    originals[method] = schema[method];
    schema[method] = function interceptedParse(...args) {
      onDetected(schema, meta.type);
      schema[method] = originals[method];
      if (isDryRun()) {
        throw new Error(ABORT_ERROR_MESSAGE);
      }
      return originals[method].apply(this, args);
    };
    patched = true;
  }
  return patched ? originals : null;
}
function getWatchableSchemas() {
  return _schemaRegistryArray;
}
var _schemaRegistryArray = [];
var registryCleanup = new FinalizationRegistry((schema) => {
  const index = _schemaRegistryArray.findIndex((entry) => entry.schema === schema);
  if (index !== -1) _schemaRegistryArray.splice(index, 1);
});
function registerForDryRun(schema, meta) {
  _schemaRegistryArray.push({ schema, meta });
  try {
    registryCleanup.register(schema, schema);
  } catch {
  }
}

// src/schema/validate.js
var import_zod_to_json_schema = require("zod-to-json-schema");
var import_module4 = require("module");
var _require3 = (0, import_module4.createRequire)(__importMetaUrl);
var _TYPEBOX_KIND = Symbol.for("TypeBox.Kind");
var _valibotModule = null;
var _typeboxValueModule = null;
async function _getValibot() {
  if (_valibotModule !== void 0) return _valibotModule;
  try {
    _valibotModule = await import("valibot");
  } catch {
    _valibotModule = null;
  }
  return _valibotModule;
}
async function _getTypeBoxValue() {
  if (_typeboxValueModule !== void 0) return _typeboxValueModule;
  try {
    _typeboxValueModule = await Promise.resolve().then(() => __toESM(require_value2(), 1));
  } catch {
    _typeboxValueModule = null;
  }
  return _typeboxValueModule;
}
var schemaRegistry = /* @__PURE__ */ new Map();
function validate(schema, options = {}) {
  const { strict = false, response: responseSchema, responses, tags, meta, auth, externalDocs, problemDetails = false } = options;
  const library = detectSchemaLibrary(schema);
  if (!library) {
    throw new Error(
      "[nodox] validate() received an unrecognized schema type. Pass a Zod schema, Joi schema, or a plain JSON Schema object."
    );
  }
  const jsonSchema = toJsonSchema(schema, library);
  let outputJsonSchema = null;
  if (responseSchema) {
    const responseLibrary = detectSchemaLibrary(responseSchema);
    if (responseLibrary) {
      outputJsonSchema = toJsonSchema(responseSchema, responseLibrary);
    } else {
      throw new Error(
        "[nodox] validate() options.response received an unrecognized schema type. Pass a Zod schema, Joi schema, or a plain JSON Schema object."
      );
    }
  }
  let outputByStatus = null;
  if (responses && typeof responses === "object") {
    outputByStatus = {};
    for (const [statusCode, resSchema] of Object.entries(responses)) {
      const resLib = detectSchemaLibrary(resSchema);
      if (resLib) {
        const resJson = toJsonSchema(resSchema, resLib);
        if (resJson) outputByStatus[String(statusCode)] = resJson;
      }
    }
    if (Object.keys(outputByStatus).length === 0) outputByStatus = null;
  }
  const normalizedTags = Array.isArray(tags) && tags.length > 0 ? tags.filter((t) => typeof t === "string" && t.length > 0) : null;
  let normalizedMeta = null;
  if (meta && typeof meta === "object") {
    const m = {};
    if (typeof meta.summary === "string" && meta.summary.trim()) m.summary = meta.summary.trim();
    if (typeof meta.description === "string" && meta.description.trim()) m.description = meta.description.trim();
    if (meta.examples && typeof meta.examples === "object") m.examples = meta.examples;
    if (meta.deprecated === true) m.deprecated = true;
    if (Object.keys(m).length > 0) normalizedMeta = m;
  }
  const _VALID_AUTH_TYPES = /* @__PURE__ */ new Set(["bearer", "apiKey", "basic", "oauth2"]);
  let normalizedAuth = null;
  if (auth && typeof auth === "object" && _VALID_AUTH_TYPES.has(auth.type)) {
    const a = { type: auth.type };
    if (typeof auth.description === "string" && auth.description.trim()) {
      a.description = auth.description.trim();
    }
    if (auth.type === "apiKey") {
      a.name = typeof auth.name === "string" && auth.name.trim() ? auth.name.trim() : "X-API-Key";
      a.in = ["header", "query", "cookie"].includes(auth.in) ? auth.in : "header";
    }
    if (auth.type === "oauth2" && Array.isArray(auth.scopes)) {
      a.scopes = auth.scopes.filter((s) => typeof s === "string" && s.length > 0);
    }
    normalizedAuth = a;
  }
  let normalizedExternalDocs = null;
  if (externalDocs && typeof externalDocs === "object" && typeof externalDocs.url === "string" && externalDocs.url.trim()) {
    normalizedExternalDocs = { url: externalDocs.url.trim() };
    if (typeof externalDocs.description === "string" && externalDocs.description.trim()) {
      normalizedExternalDocs.description = externalDocs.description.trim();
    }
  }
  const source = captureValidateCallsite();
  const registeredSchema = {
    library,
    rawSchema: schema,
    jsonSchema,
    outputJsonSchema,
    outputByStatus,
    tags: normalizedTags,
    meta: normalizedMeta,
    auth: normalizedAuth,
    externalDocs: normalizedExternalDocs,
    problemDetails,
    source,
    confidence: "confirmed"
  };
  async function nodoxValidateMiddleware(req, res, next) {
    let result;
    const _sendError = (details) => {
      if (problemDetails) {
        return res.status(400).json({
          type: "about:blank",
          title: "Validation Failed",
          status: 400,
          detail: "One or more fields failed validation.",
          errors: details.map((d) => ({
            pointer: d.path ? `/${d.path.replace(/\./g, "/")}` : "/",
            detail: d.message
          }))
        });
      }
      return res.status(400).json({ error: "Validation failed", details });
    };
    try {
      if (library === "zod") {
        result = strict ? schema.strict().safeParse(req.body) : schema.safeParse(req.body);
        if (!result.success) {
          const issues = result.error.issues ?? result.error.errors ?? [];
          return _sendError(issues.map((e) => ({
            path: Array.isArray(e.path) ? e.path.join(".") : String(e.path ?? ""),
            message: e.message,
            code: e.code
          })));
        }
        req.body = result.data;
      } else if (library === "joi") {
        const { error, value } = schema.validate(req.body, {
          abortEarly: false,
          allowUnknown: !strict
        });
        if (error) {
          return _sendError(error.details.map((d) => ({
            path: d.path.join("."),
            message: d.message,
            type: d.type
          })));
        }
        req.body = value;
      } else if (library === "yup") {
        req.body = schema.validateSync(req.body, {
          abortEarly: false,
          stripUnknown: !strict
        });
      } else if (library === "valibot") {
        const v = await _getValibot();
        if (v && typeof v.safeParse === "function") {
          const vResult = v.safeParse(schema, req.body);
          if (!vResult.success) {
            return _sendError((vResult.issues || []).map((issue) => ({
              path: issue.path?.map((p) => String(p.key ?? p)).join(".") ?? "",
              message: issue.message,
              code: issue.type
            })));
          }
          req.body = vResult.output;
        }
      } else if (library === "typebox") {
        const tbv = await _getTypeBoxValue();
        if (tbv?.Value && typeof tbv.Value.Check === "function") {
          if (!tbv.Value.Check(schema, req.body)) {
            const errors = [...tbv.Value.Errors(schema, req.body)];
            return _sendError(errors.map((e) => ({
              path: e.path?.replace(/^\//, "").replace(/\//g, ".") ?? "",
              message: e.message,
              code: "invalid_value"
            })));
          }
        }
      } else if (library === "jsonschema") {
        req.body = req.body;
      }
    } catch (err) {
      if (err?.name === "ValidationError" && err?.inner) {
        return _sendError((err.inner.length ? err.inner : [err]).map((e) => ({
          path: e.path || "",
          message: e.message,
          type: e.type
        })));
      }
      console.error("[nodox] validate() middleware threw unexpectedly:", err);
      return res.status(500).json({ error: "Internal validation error" });
    }
    next();
  }
  nodoxValidateMiddleware.__nodoxSchema = registeredSchema;
  nodoxValidateMiddleware.__isNodoxValidate = true;
  return nodoxValidateMiddleware;
}
function detectSchemaLibrary(schema) {
  if (!schema || typeof schema !== "object") return null;
  if (schema._def?.typeName) return "zod";
  if (typeof schema.safeParse === "function" && typeof schema.toJSONSchema === "function") return "zod";
  if (schema.def?.type && typeof schema.safeParse === "function") return "zod";
  if (schema.isJoi || schema.$_root) return "joi";
  if (schema.type && typeof schema.type === "string" && schema.$_terms) return "joi";
  if (schema._type && typeof schema.validateSync === "function") return "yup";
  if (schema.__isYupSchema__ && typeof schema.validate === "function") return "yup";
  if (schema["~standard"]?.vendor === "valibot") return "valibot";
  if (schema.kind === "schema" && typeof schema._run === "function") return "valibot";
  if (_TYPEBOX_KIND in schema) return "typebox";
  if ((schema.type || schema.properties || schema.$schema || schema.anyOf) && typeof schema.safeParse !== "function") return "jsonschema";
  return null;
}
function toJsonSchema(schema, library) {
  try {
    if (library === "zod") {
      if (typeof schema.toJSONSchema === "function") {
        const result = schema.toJSONSchema();
        const { $schema, ...rest } = result;
        return rest;
      }
      return (0, import_zod_to_json_schema.zodToJsonSchema)(schema, {
        name: void 0,
        $refStrategy: "none"
      });
    }
    if (library === "joi") {
      return joiToJsonSchema(schema);
    }
    if (library === "yup") {
      return yupToJsonSchema(schema);
    }
    if (library === "valibot") {
      try {
        const v = _require3("valibot");
        if (typeof v.toJsonSchema === "function") {
          return v.toJsonSchema(schema);
        }
      } catch {
      }
      return valibotToJsonSchema(schema);
    }
    if (library === "typebox") {
      const { $schema, ...rest } = schema;
      return rest;
    }
    if (library === "jsonschema") {
      return schema;
    }
  } catch (err) {
    console.warn("[nodox] Failed to convert schema to JSON Schema:", err.message);
  }
  return { type: "object" };
}
function yupToJsonSchema(yupSchema) {
  try {
    const desc = yupSchema.describe();
    return yupDescToJsonSchema(desc);
  } catch {
    return { type: "object", description: "yup schema (conversion failed)" };
  }
}
function yupDescToJsonSchema(desc) {
  if (!desc) return {};
  const out = {};
  switch (desc.type) {
    case "object": {
      out.type = "object";
      if (desc.fields) {
        out.properties = {};
        const required = [];
        for (const [key, val] of Object.entries(desc.fields)) {
          out.properties[key] = yupDescToJsonSchema(val);
          const isOptional = val.optional === true || val.nullable === true;
          if (!isOptional) required.push(key);
        }
        if (required.length) out.required = required;
      }
      break;
    }
    case "string":
      out.type = "string";
      break;
    case "number":
      out.type = "number";
      break;
    case "boolean":
      out.type = "boolean";
      break;
    case "array":
      out.type = "array";
      if (desc.innerType) out.items = yupDescToJsonSchema(desc.innerType);
      break;
    case "date":
      out.type = "string";
      out.format = "date-time";
      break;
    default:
      out.type = desc.type || "any";
  }
  if (desc.label) out.description = desc.label;
  if (desc.nullable === true && out.type && out.type !== "null") {
    out.type = [out.type, "null"];
  }
  return out;
}
function joiToJsonSchema(joiSchema) {
  try {
    const desc = joiSchema.describe();
    return joiDescToJsonSchema(desc);
  } catch {
    return { type: "object", description: "Joi schema (conversion failed)" };
  }
}
function joiDescToJsonSchema(desc) {
  if (!desc) return {};
  const out = {};
  switch (desc.type) {
    case "object": {
      out.type = "object";
      if (desc.keys) {
        out.properties = {};
        const required = [];
        for (const [key, val] of Object.entries(desc.keys)) {
          out.properties[key] = joiDescToJsonSchema(val);
          if (!val.flags?.presence || val.flags.presence === "required") {
            required.push(key);
          }
        }
        if (required.length) out.required = required;
      }
      break;
    }
    case "string":
      out.type = "string";
      if (desc.flags?.only && desc.allow?.length) {
        out.enum = desc.allow;
      }
      break;
    case "number":
    case "integer":
      out.type = desc.type;
      break;
    case "boolean":
      out.type = "boolean";
      break;
    case "array":
      out.type = "array";
      if (desc.items?.length) {
        out.items = joiDescToJsonSchema(desc.items[0]);
      }
      break;
    case "date":
      out.type = "string";
      out.format = "date-time";
      break;
    default:
      out.type = desc.type || "any";
  }
  if (desc.flags?.description) {
    out.description = desc.flags.description;
  }
  if (Array.isArray(desc.allow) && desc.allow.includes(null) && out.type && out.type !== "null") {
    out.type = [out.type, "null"];
  }
  return out;
}
function registerSchemaForRoute(method, path3, schema) {
  const key = `${method.toUpperCase()}:${path3}`;
  schemaRegistry.set(key, schema);
}
function valibotToJsonSchema(schema, depth = 0) {
  if (depth > 12 || !schema || typeof schema !== "object") return {};
  const type = schema.type;
  if (type === "object" && schema.entries) {
    const properties = {};
    const required = [];
    for (const [key, field] of Object.entries(schema.entries)) {
      properties[key] = valibotToJsonSchema(field, depth + 1);
      if (field.type !== "optional" && field.type !== "nullish") required.push(key);
    }
    const out = { type: "object", properties };
    if (required.length) out.required = required;
    return out;
  }
  if ((type === "optional" || type === "nullish") && schema.wrapped) {
    const inner = valibotToJsonSchema(schema.wrapped, depth + 1);
    if (type === "nullish") return { ...inner, type: [inner.type || "string", "null"] };
    return inner;
  }
  if (type === "nullable" && schema.wrapped) {
    const inner = valibotToJsonSchema(schema.wrapped, depth + 1);
    return { ...inner, type: [inner.type || "string", "null"] };
  }
  if (type === "array") {
    const out = { type: "array" };
    if (schema.item) out.items = valibotToJsonSchema(schema.item, depth + 1);
    return out;
  }
  if (type === "union" && Array.isArray(schema.options)) {
    return { anyOf: schema.options.map((o) => valibotToJsonSchema(o, depth + 1)) };
  }
  if (type === "picklist" && Array.isArray(schema.options)) {
    return { type: "string", enum: schema.options };
  }
  const primitive = { string: "string", number: "number", boolean: "boolean", null: "null" };
  if (primitive[type]) return { type: primitive[type] };
  return { type: "object" };
}
function captureValidateCallsite() {
  try {
    const err = new Error();
    const lines = err.stack?.split("\n") || [];
    for (const line of lines.slice(2)) {
      const match = line.match(/\((.+?):(\d+):\d+\)/) || line.match(/at (.+?):(\d+):\d+/);
      if (!match) continue;
      const file = match[1];
      if (file.includes("nodox-cli/src") || file.includes("node_modules/nodox-cli")) continue;
      if (file.includes("node:internal")) continue;
      const cwd = process.cwd();
      const relative = file.startsWith(cwd) ? file.slice(cwd.length).replace(/^[\\/]/, "") : file.split(/[\\/]node_modules[\\/]/).pop() ?? file;
      return `${relative}:${match[2]}`;
    }
    return null;
  } catch {
    return null;
  }
}

// src/schema/schema-detector.js
var import_module5 = require("module");

// src/layer4/cache-reader.js
var import_fs3 = __toESM(require("fs"), 1);
var import_path2 = __toESM(require("path"), 1);
function findCacheFile(startDir = process.cwd()) {
  let dir = startDir;
  for (let i = 0; i < 5; i++) {
    const candidate = import_path2.default.join(dir, ".apicache.json");
    if (import_fs3.default.existsSync(candidate)) return candidate;
    const parent = import_path2.default.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}
function loadCacheEntries(cacheFile) {
  const filePath = cacheFile || findCacheFile();
  if (!filePath) return {};
  try {
    const raw = import_fs3.default.readFileSync(filePath, "utf8");
    const parsed = JSON.parse(raw);
    return parsed?.routes || {};
  } catch {
    return {};
  }
}

// src/schema/schema-detector.js
var require3 = (0, import_module5.createRequire)(__importMetaUrl);
var routeSchemas = /* @__PURE__ */ new Map();
var parsedValueToSchema = /* @__PURE__ */ new WeakMap();
var schemaJsonSchemaCache = /* @__PURE__ */ new WeakMap();
var CONFIDENCE_ORDER = { confirmed: 3, inferred: 2, observed: 1, none: 0 };
var _rawCacheEntries = null;
function urlMatchesTemplate(urlPath, templatePath) {
  if (!urlPath || !templatePath) return false;
  if (templatePath === "*" || templatePath === "/*") return false;
  const url = urlPath.split("?")[0];
  const urlSegs = url.split("/").filter(Boolean);
  const tplSegs = templatePath.split("/").filter(Boolean);
  if (urlSegs.length !== tplSegs.length) return false;
  for (let i = 0; i < tplSegs.length; i++) {
    const seg = tplSegs[i];
    if (seg.startsWith(":")) continue;
    if (seg.startsWith("(") && seg.endsWith(")")) continue;
    if (seg !== urlSegs[i]) return false;
  }
  return true;
}
function _findMatchingCacheEntry(method, templatePath) {
  if (!_rawCacheEntries) return null;
  const upper = method.toUpperCase();
  for (const [key, entry] of Object.entries(_rawCacheEntries)) {
    const colon = key.indexOf(":");
    if (colon === -1) continue;
    if (key.slice(0, colon).toUpperCase() !== upper) continue;
    if (urlMatchesTemplate(key.slice(colon + 1), templatePath)) return entry;
  }
  return null;
}
function _isExpressValidatorChain(fn) {
  if (!fn || typeof fn !== "function") return false;
  if (fn.builder?.fields && Array.isArray(fn.builder.fields)) return true;
  if (fn._context?.fields && Array.isArray(fn._context.fields)) return true;
  return false;
}
function _inferEVFieldType(validators) {
  for (const v of validators) {
    const name = typeof v?.validator === "function" ? v.validator.name : typeof v === "function" ? v.name : "";
    switch (name) {
      case "isEmail":
        return { type: "string", format: "email" };
      case "isURL":
        return { type: "string", format: "uri" };
      case "isISO8601":
      case "isDate":
        return { type: "string", format: "date-time" };
      case "isUUID":
        return { type: "string", format: "uuid" };
      case "isInt":
      case "isNumeric":
        return { type: "integer" };
      case "isFloat":
      case "isDecimal":
        return { type: "number" };
      case "isBoolean":
        return { type: "boolean" };
      case "isArray":
        return { type: "array" };
      case "isObject":
      case "isJSON":
        return { type: "object" };
    }
  }
  return { type: "string" };
}
function _extractExpressValidatorSchema(handlers) {
  const properties = {};
  for (const fn of handlers) {
    if (!_isExpressValidatorChain(fn)) continue;
    const ctx = fn.builder ?? fn._context;
    const fields = ctx?.fields ?? [];
    const validators = ctx?.stack ?? // v7
    ctx?.validators ?? // v6 alternate
    [];
    for (const field of fields) {
      if (typeof field !== "string" || !field) continue;
      properties[field] = _inferEVFieldType(validators);
    }
  }
  return Object.keys(properties).length > 0 ? { type: "object", properties } : null;
}
function routeKey(method, path3) {
  return `${method.toUpperCase()}:${path3}`;
}
function getOrCreateSchema(method, path3) {
  const key = routeKey(method, path3);
  if (!routeSchemas.has(key)) {
    routeSchemas.set(key, {
      input: null,
      output: null,
      outputByStatus: null,
      querySchema: null,
      inputConfidence: "none",
      outputConfidence: "none",
      querySchemaConfidence: "none",
      source: null,
      tags: null,
      meta: null,
      auth: null
    });
  }
  return routeSchemas.get(key);
}
function loadCacheIntoRegistry(cacheFile) {
  const entries = loadCacheEntries(cacheFile);
  const keys = Object.keys(entries);
  if (keys.length === 0) return 0;
  _rawCacheEntries = entries;
  for (const [key, entry] of Object.entries(entries)) {
    const colonIdx = key.indexOf(":");
    if (colonIdx === -1) continue;
    const method = key.slice(0, colonIdx);
    const path3 = key.slice(colonIdx + 1);
    const existing = routeSchemas.get(key);
    const canSetInput = !existing || existing.inputConfidence === "none" && entry.input;
    const canSetOutput = !existing || !existing.output && entry.output;
    if (!canSetInput && !canSetOutput) continue;
    const schema = getOrCreateSchema(method, path3);
    if (canSetInput && entry.input) {
      schema.input = entry.input;
      schema.inputConfidence = "observed";
    }
    if (canSetOutput && entry.output) {
      schema.output = entry.output;
      schema.outputConfidence = "observed";
    }
    if (entry.seenCount) schema.seenCount = entry.seenCount;
    if (entry.lastSeen) schema.lastSeen = entry.lastSeen;
  }
  return keys.length;
}
var _detectorInitialized = false;
function initSchemaDetector() {
  if (_detectorInitialized) return;
  _detectorInitialized = true;
  try {
    let zodPath;
    try {
      zodPath = require3.resolve("zod", { paths: [process.cwd()] });
    } catch {
      zodPath = "zod";
    }
    const zod = require3(zodPath);
    const z = zod?.z || zod?.default?.z || (zod?.object ? zod : zod?.default);
    if (z) {
      patchZodWithRegistry(z);
    }
  } catch {
  }
  try {
    const joi = require3("joi");
    const j = joi?.object ? joi : joi?.default;
    if (j) {
      patchJoiWithRegistry(j);
    }
  } catch {
  }
  try {
    const yup = require3("yup");
    const y = yup?.object ? yup : yup?.default;
    if (y) {
      patchYupWithRegistry(y);
    }
  } catch {
  }
}
var _patchedZInstances = /* @__PURE__ */ new WeakSet();
initSchemaDetector();
function tagParsedValue(value, schema, library) {
  if (value === null || value === void 0 || typeof value !== "object") return;
  try {
    let jsonSchema = schemaJsonSchemaCache.get(schema);
    if (!jsonSchema) {
      jsonSchema = toJsonSchema(schema, library);
      if (jsonSchema) schemaJsonSchemaCache.set(schema, jsonSchema);
    }
    if (jsonSchema) parsedValueToSchema.set(value, jsonSchema);
  } catch {
  }
}
function patchZodInstanceForOutputTracking(schema) {
  const handlers = {
    parse(orig) {
      return function nodoxTrackedParse(...args) {
        const result = orig.apply(this, args);
        tagParsedValue(result, this, "zod");
        return result;
      };
    },
    safeParse(orig) {
      return function nodoxTrackedSafeParse(...args) {
        const result = orig.apply(this, args);
        if (result?.success) tagParsedValue(result.data, this, "zod");
        return result;
      };
    },
    parseAsync(orig) {
      return async function nodoxTrackedParseAsync(...args) {
        const result = await orig.apply(this, args);
        tagParsedValue(result, this, "zod");
        return result;
      };
    },
    safeParseAsync(orig) {
      return async function nodoxTrackedSafeParseAsync(...args) {
        const result = await orig.apply(this, args);
        if (result?.success) tagParsedValue(result.data, this, "zod");
        return result;
      };
    }
  };
  for (const [method, wrap] of Object.entries(handlers)) {
    if (typeof schema[method] !== "function") continue;
    if (schema[method].__nodoxTracked) continue;
    const orig = schema[method];
    const patched = wrap(orig);
    patched.__nodoxTracked = true;
    try {
      schema[method] = patched;
    } catch {
      try {
        Object.defineProperty(schema, method, { value: patched, writable: true, configurable: false });
      } catch {
      }
    }
  }
}
function patchZodProtoForOutputTracking(z) {
  let baseProto;
  try {
    let proto = Object.getPrototypeOf(z.string());
    while (proto && proto !== Object.prototype) {
      const parent = Object.getPrototypeOf(proto);
      if (!parent || parent === Object.prototype || typeof parent.parse !== "function") {
        baseProto = proto;
        break;
      }
      proto = parent;
    }
  } catch {
    return;
  }
  if (!baseProto || typeof baseProto.parse !== "function" || baseProto.__nodoxZodProtoPatched) return;
  baseProto.__nodoxZodProtoPatched = true;
  const handlers = {
    parse: (orig) => function nodoxTrackedParse(...args) {
      const result = orig.apply(this, args);
      tagParsedValue(result, this, "zod");
      markSchemaDetectedInDryRun(this, "zod");
      return result;
    },
    safeParse: (orig) => function nodoxTrackedSafeParse(...args) {
      const result = orig.apply(this, args);
      if (result?.success) {
        tagParsedValue(result.data, this, "zod");
        markSchemaDetectedInDryRun(this, "zod");
      }
      return result;
    },
    parseAsync: (orig) => async function nodoxTrackedParseAsync(...args) {
      const result = await orig.apply(this, args);
      tagParsedValue(result, this, "zod");
      markSchemaDetectedInDryRun(this, "zod");
      return result;
    },
    safeParseAsync: (orig) => async function nodoxTrackedSafeParseAsync(...args) {
      const result = await orig.apply(this, args);
      if (result?.success) {
        tagParsedValue(result.data, this, "zod");
        markSchemaDetectedInDryRun(this, "zod");
      }
      return result;
    },
    // _parseSync / _parseAsync are the internal prototype methods that the
    // per-instance bound parse() functions call. Patching these intercepts ALL
    // schema parse calls including schemas created before patchZodWithRegistry ran
    // (ESM module-level schemas). Works for Zod v3.x where parse is a bound
    // own property that still delegates to _parseSync on the prototype.
    _parseSync: (orig) => function nodoxTracked_parseSync(...args) {
      markSchemaDetectedInDryRun(this, "zod");
      return orig.apply(this, args);
    },
    _parseAsync: (orig) => async function nodoxTracked_parseAsync(...args) {
      markSchemaDetectedInDryRun(this, "zod");
      return orig.apply(this, args);
    }
  };
  for (const [method, wrap] of Object.entries(handlers)) {
    if (typeof baseProto[method] !== "function") continue;
    baseProto[method] = wrap(baseProto[method]);
  }
}
function patchJoiProtoForOutputTracking(joi) {
  let baseProto;
  try {
    let proto = Object.getPrototypeOf(joi.any());
    while (proto && proto !== Object.prototype) {
      const parent = Object.getPrototypeOf(proto);
      if (!parent || parent === Object.prototype || typeof parent.validate !== "function") {
        baseProto = proto;
        break;
      }
      proto = parent;
    }
  } catch {
    return;
  }
  if (!baseProto || baseProto.__nodoxJoiProtoPatched) return;
  baseProto.__nodoxJoiProtoPatched = true;
  if (typeof baseProto.validate === "function") {
    const orig = baseProto.validate;
    baseProto.validate = function nodoxTrackedJoiValidate(...args) {
      const result = orig.apply(this, args);
      if (!result?.error) tagParsedValue(result?.value, this, "joi");
      return result;
    };
  }
}
function patchYupProtoForOutputTracking(yup) {
  let baseProto;
  try {
    let proto = Object.getPrototypeOf(yup.mixed ? yup.mixed() : yup.string());
    while (proto && proto !== Object.prototype) {
      const parent = Object.getPrototypeOf(proto);
      if (!parent || parent === Object.prototype || typeof parent.validateSync !== "function" && typeof parent.validate !== "function") {
        baseProto = proto;
        break;
      }
      proto = parent;
    }
  } catch {
    return;
  }
  if (!baseProto || baseProto.__nodoxYupProtoPatched) return;
  baseProto.__nodoxYupProtoPatched = true;
  if (typeof baseProto.validateSync === "function") {
    const orig = baseProto.validateSync;
    baseProto.validateSync = function nodoxTrackedYupValidateSync(...args) {
      const result = orig.apply(this, args);
      tagParsedValue(result, this, "yup");
      return result;
    };
  }
  if (typeof baseProto.validate === "function") {
    const orig = baseProto.validate;
    baseProto.validate = async function nodoxTrackedYupValidate(...args) {
      const result = await orig.apply(this, args);
      tagParsedValue(result, this, "yup");
      return result;
    };
  }
}
function patchZodWithRegistry(z) {
  if (!z || _patchedZInstances.has(z)) return;
  _patchedZInstances.add(z);
  const methodsToWrap = [
    "object",
    "string",
    "number",
    "boolean",
    "array",
    "union",
    "intersection",
    "tuple",
    "record",
    "literal",
    "enum",
    "nativeEnum",
    "any",
    "unknown",
    "date",
    "bigint",
    "discriminatedUnion"
  ];
  for (const method of methodsToWrap) {
    if (typeof z[method] !== "function") continue;
    const original = z[method].bind(z);
    const wrapped = function nodoxPatchedZodFactory(...args) {
      const schema = original(...args);
      if (schema && typeof schema === "object") {
        const meta = { type: "zod", zodType: method };
        capturedSchemas.set(schema, meta);
        registerForDryRun(schema, meta);
        patchZodInstanceForOutputTracking(schema);
      }
      return schema;
    };
    try {
      z[method] = wrapped;
    } catch {
      try {
        Object.defineProperty(z, method, { value: wrapped, writable: true });
      } catch {
      }
    }
  }
  patchZodProtoForOutputTracking(z);
}
function patchJoiWithRegistry(joi) {
  const methodsToWrap = [
    "object",
    "string",
    "number",
    "boolean",
    "array",
    "any",
    "date",
    "alternatives",
    "binary"
  ];
  for (const method of methodsToWrap) {
    if (typeof joi[method] !== "function") continue;
    const original = joi[method].bind(joi);
    joi[method] = function(...args) {
      const schema = original(...args);
      if (schema && typeof schema === "object") {
        const meta = { type: "joi", joiType: method };
        capturedSchemas.set(schema, meta);
        registerForDryRun(schema, meta);
      }
      return schema;
    };
  }
  patchJoiProtoForOutputTracking(joi);
}
function patchYupWithRegistry(yup) {
  const methodsToWrap = ["object", "string", "number", "boolean", "array", "mixed", "date"];
  for (const method of methodsToWrap) {
    if (typeof yup[method] !== "function") continue;
    const original = yup[method].bind(yup);
    yup[method] = function(...args) {
      const schema = original(...args);
      if (schema && typeof schema === "object") {
        const meta = { type: "yup", yupType: method };
        capturedSchemas.set(schema, meta);
        registerForDryRun(schema, meta);
      }
      return schema;
    };
  }
  patchYupProtoForOutputTracking(yup);
}
var _registeredRoutePaths = /* @__PURE__ */ new Set();
function wasRouteRegistered(method, path3) {
  return _registeredRoutePaths.has(routeKey(method, path3));
}
function onQueryObserved(method, path3, shape, onUpdate) {
  const entry = getOrCreateSchema(method, path3);
  if (entry.querySchemaConfidence !== "none") return;
  entry.querySchema = shape;
  entry.querySchemaConfidence = "observed";
  if (typeof onUpdate === "function") onUpdate();
}
function onRouteRegistered(method, path3, handlers) {
  _registeredRoutePaths.add(routeKey(method, path3));
  for (const handler of handlers) {
    if (handler?.__isNodoxValidate && handler?.__nodoxSchema) {
      const entry = getOrCreateSchema(method, path3);
      entry.input = handler.__nodoxSchema.jsonSchema;
      entry.inputConfidence = "confirmed";
      entry.source = handler.__nodoxSchema.source;
      if (handler.__nodoxSchema.outputJsonSchema) {
        entry.output = handler.__nodoxSchema.outputJsonSchema;
        entry.outputConfidence = "confirmed";
      }
      if (handler.__nodoxSchema.outputByStatus) {
        entry.outputByStatus = handler.__nodoxSchema.outputByStatus;
      }
      if (handler.__nodoxSchema.tags) {
        entry.tags = handler.__nodoxSchema.tags;
      }
      if (handler.__nodoxSchema.meta) {
        entry.meta = handler.__nodoxSchema.meta;
      }
      if (handler.__nodoxSchema.auth) {
        entry.auth = handler.__nodoxSchema.auth;
      }
      registerSchemaForRoute(method, path3, handler.__nodoxSchema);
      return;
    }
  }
  const evSchema = _extractExpressValidatorSchema(handlers);
  if (evSchema) {
    const entry = getOrCreateSchema(method, path3);
    if (CONFIDENCE_ORDER[entry.inputConfidence] < CONFIDENCE_ORDER.inferred) {
      entry.input = evSchema;
      entry.inputConfidence = "inferred";
    }
  }
  const flagged = handlers.filter((fn) => typeof fn === "function" && looksLikeValidator(fn));
  if (flagged.length > 0) {
    if (_dryRunStartupComplete) {
      _dryRunRoute(method, path3, flagged).catch(() => {
      });
    } else {
      pendingDryRuns.push({ method, path: path3, handlers: flagged });
    }
  }
}
var pendingDryRuns = [];
var _dryRunStartupComplete = false;
function _reconstructSchemaFromZodError(error) {
  if (!Array.isArray(error?.issues) || error.issues.length === 0) return null;
  const properties = {};
  const required = [];
  for (const issue of error.issues) {
    if (!issue.path || issue.path.length !== 1) continue;
    const field = String(issue.path[0]);
    if (!field) continue;
    if (issue.code === "invalid_type") {
      const typeMap = {
        string: "string",
        number: "number",
        integer: "integer",
        boolean: "boolean",
        object: "object",
        array: "array",
        date: "string",
        bigint: "integer",
        null: "null",
        undefined: "null"
      };
      const jsType = typeMap[issue.expected] ?? "string";
      properties[field] = issue.expected === "date" ? { type: "string", format: "date-time" } : { type: jsType };
      required.push(field);
    }
  }
  if (Object.keys(properties).length === 0) return null;
  const schema = { type: "object", properties };
  if (required.length > 0) schema.required = [...new Set(required)];
  schema.description = "(inferred from validation errors \u2014 optional fields may be absent)";
  return schema;
}
function _reconstructSchemaFromTwoPasses(emptyBodyError, nullProbeError) {
  if (!nullProbeError || !Array.isArray(nullProbeError.issues) || nullProbeError.issues.length === 0) return null;
  const requiredFields = /* @__PURE__ */ new Set();
  for (const issue of emptyBodyError?.issues ?? []) {
    if (issue.path?.length === 1) requiredFields.add(String(issue.path[0]));
  }
  const properties = {};
  const required = [];
  for (const issue of nullProbeError.issues) {
    if (!issue.path || issue.path.length !== 1) continue;
    const field = String(issue.path[0]);
    if (!field) continue;
    if (issue.code === "invalid_type") {
      const typeMap = {
        string: "string",
        number: "number",
        integer: "integer",
        boolean: "boolean",
        object: "object",
        array: "array",
        date: "string",
        bigint: "integer",
        null: "null",
        undefined: "null"
      };
      properties[field] = issue.expected === "date" ? { type: "string", format: "date-time" } : { type: typeMap[issue.expected] ?? "string" };
      if (requiredFields.has(field)) required.push(field);
    }
  }
  if (Object.keys(properties).length === 0) return null;
  const schema = { type: "object", properties };
  if (required.length > 0) schema.required = [...new Set(required)];
  return schema;
}
async function _dryRunRoute(method, path3, handlers) {
  const existing = routeSchemas.get(routeKey(method, path3));
  if (existing?.inputConfidence === "confirmed") return false;
  for (const handler of handlers) {
    const result = await dryRunValidator(handler, method);
    if (result.schema) {
      const meta = capturedSchemas.get(result.schema);
      const library = result.library || meta?.type;
      if (!library) continue;
      const jsonSchema = toJsonSchema(result.schema, library);
      if (!jsonSchema) continue;
      const entry = getOrCreateSchema(method, path3);
      entry.input = jsonSchema;
      entry.inputConfidence = "inferred";
      return true;
    }
    const nullResult = await dryRunValidator(handler, method, createNullProbeBody());
    if (nullResult.zodError || result.zodError) {
      const jsonSchema = _reconstructSchemaFromTwoPasses(result.zodError, nullResult.zodError);
      if (jsonSchema && !existing?.input) {
        const entry = getOrCreateSchema(method, path3);
        entry.input = jsonSchema;
        entry.inputConfidence = "inferred";
        return true;
      }
    }
    if (result.zodError && !existing?.input) {
      const jsonSchema = _reconstructSchemaFromZodError(result.zodError);
      if (jsonSchema) {
        const entry = getOrCreateSchema(method, path3);
        entry.input = jsonSchema;
        entry.inputConfidence = "inferred";
        return true;
      }
    }
  }
  return false;
}
var _userZodProtoPatchApplied = false;
function _patchUserZodProtoFromRegistry() {
  if (_userZodProtoPatchApplied) return;
  const sources = [
    ..._schemaRegistryArray.map((e) => e.schema),
    ...[...schemaRegistry.values()].map((e) => e?.rawSchema || e).filter(Boolean)
  ];
  for (const schema of sources) {
    if (!schema || typeof schema !== "object") continue;
    let p = Object.getPrototypeOf(schema);
    while (p && p !== Object.prototype) {
      if (typeof p._parseSync === "function" && !p.__nodoxZodProtoPatched) {
        p.__nodoxZodProtoPatched = true;
        const origSync = p._parseSync;
        p._parseSync = function nodoxTracked_parseSync(...args) {
          markSchemaDetectedInDryRun(this, "zod");
          return origSync.apply(this, args);
        };
        if (typeof p._parseAsync === "function") {
          const origAsync = p._parseAsync;
          p._parseAsync = async function nodoxTracked_parseAsync(...args) {
            markSchemaDetectedInDryRun(this, "zod");
            return origAsync.apply(this, args);
          };
        }
        _userZodProtoPatchApplied = true;
        return;
      }
      p = Object.getPrototypeOf(p);
    }
  }
}
async function runDeferredDryRuns() {
  try {
    const esmMod = await import("zod");
    const esmZ = esmMod?.z || esmMod?.default?.z || (esmMod?.object ? esmMod : esmMod?.default);
    if (esmZ) patchZodWithRegistry(esmZ);
  } catch {
  }
  _patchUserZodProtoFromRegistry();
  for (const { method, path: path3, handlers } of pendingDryRuns) {
    const success = await _dryRunRoute(method, path3, handlers);
    if (success) {
      console.log(`\x1B[32m  \u2713 nodox\x1B[0m \x1B[2mInferred schema for ${method} ${path3}\x1B[0m`);
    } else {
    }
  }
  pendingDryRuns.length = 0;
  _dryRunStartupComplete = true;
}
function onInputObserved(method, path3, shape, confidence = "observed", onUpdate) {
  const entry = getOrCreateSchema(method, path3);
  const existing = CONFIDENCE_ORDER[entry.inputConfidence] ?? 0;
  const incoming = CONFIDENCE_ORDER[confidence] ?? 0;
  if (incoming <= existing) return;
  entry.input = shape;
  entry.inputConfidence = confidence;
  if (typeof onUpdate === "function") {
    onUpdate(method, path3, { input: shape, inputConfidence: confidence });
  }
}
function onResponseObserved(method, path3, shape, confidence = "observed", onUpdate) {
  const entry = getOrCreateSchema(method, path3);
  const existing = CONFIDENCE_ORDER[entry.outputConfidence] ?? 0;
  const incoming = CONFIDENCE_ORDER[confidence] ?? 0;
  if (incoming <= existing) return;
  entry.output = shape;
  entry.outputConfidence = confidence;
  if (typeof onUpdate === "function") {
    onUpdate(method, path3, { output: shape, outputConfidence: confidence });
  }
}
function getRouteSchema(method, path3) {
  return routeSchemas.get(routeKey(method, path3)) ?? null;
}
function enrichRoutesWithSchemas(routes) {
  return routes.map((route) => {
    let schema = getRouteSchema(route.method, route.path);
    if (!schema && _rawCacheEntries) {
      const cacheEntry = _findMatchingCacheEntry(route.method, route.path);
      if (cacheEntry) {
        const s = getOrCreateSchema(route.method, route.path);
        if (cacheEntry.input && s.inputConfidence === "none") {
          s.input = cacheEntry.input;
          s.inputConfidence = "observed";
        }
        if (cacheEntry.output && !s.output) {
          s.output = cacheEntry.output;
          s.outputConfidence = "observed";
        }
        if (cacheEntry.seenCount) s.seenCount = cacheEntry.seenCount;
        schema = s;
      }
    }
    if (schema && !schema.auth && route.handlers?.length) {
      const inferred = _inferAuthFromHandlers(route.handlers);
      if (inferred) schema.auth = inferred;
    }
    return {
      ...route,
      hasValidator: schema?.inputConfidence === "confirmed" || schema?.inputConfidence === "inferred",
      schema: schema ?? null,
      version: _detectVersion(route.path),
      // Exclude raw handler functions from the serialized route — they're only
      // needed for retroactive schema detection and must not be sent over WebSocket.
      handlers: void 0
    };
  });
}
function _detectVersion(routePath) {
  const m = routePath.match(/\/v(\d+)\b/i);
  return m ? `v${m[1]}` : null;
}
var _AUTH_BEARER_RE = /^(bearer|jwt|jwtauth|verifyjwt|checkjwt|authjwt|jwtmiddleware|verifytoken|checktoken|authtoken)$/i;
var _AUTH_APIKEY_RE = /^(apikey|checkapikey|apikeyauth|apikeymiddleware)$/i;
var _AUTH_BASIC_RE = /^(basic|basicauth|checkbasic)$/i;
var _AUTH_OAUTH_RE = /^(oauth|oauth2|checkoauth)$/i;
var _AUTH_GENERIC_RE = /^(authenticate|requireauth|isAuthenticated|ensureAuthenticated|requirelogin|authcheck|checkauth|verifyauth|authmiddleware|protectedroute|needsauth|authorized|authorization)$/i;
function _inferAuthFromHandlers(handlers) {
  for (const fn of handlers) {
    if (!fn || typeof fn !== "function") continue;
    const name = (fn.name || "").toLowerCase();
    if (!name || name === "anonymous" || name === "bound ") continue;
    if (_AUTH_APIKEY_RE.test(name)) return { type: "apiKey", name: "X-API-Key", in: "header" };
    if (_AUTH_BASIC_RE.test(name)) return { type: "basic" };
    if (_AUTH_OAUTH_RE.test(name)) return { type: "oauth2" };
    if (_AUTH_BEARER_RE.test(name) || _AUTH_GENERIC_RE.test(fn.name || "")) return { type: "bearer" };
  }
  return null;
}

// src/index.js
function nodox(appOrOptions, options = {}) {
  let app = null;
  if (appOrOptions && typeof appOrOptions.use === "function") {
    app = appOrOptions;
  } else if (appOrOptions && typeof appOrOptions === "object") {
    options = appOrOptions;
  }
  const {
    uiPath = "/__nodox",
    log = true,
    schema = true,
    intercept = true,
    force = false,
    info,
    server: externalServer = null
  } = options;
  if (process.env.NODE_ENV === "production" && !force) {
    console.warn(
      "[nodox] Disabled in production (NODE_ENV=production).\n        Pass { force: true } to override \u2014 but do not expose /__nodox publicly."
    );
    return function nodoxDisabledMiddleware(_req, _res, next) {
      next();
    };
  }
  let routes = [];
  let wsServer = null;
  let serverAttached = false;
  let extractionTimer = null;
  let appInitDone = false;
  let portLogged = false;
  if (schema) initSchemaDetector();
  let _userZodEsmPatchPromise = null;
  function ensureUserZodEsmPatched() {
    if (_userZodEsmPatchPromise) return _userZodEsmPatchPromise;
    _userZodEsmPatchPromise = (async () => {
      try {
        let zodEsmPath = null;
        try {
          const searchPaths = [
            process.argv[1] ? import_path3.default.dirname(process.argv[1]) : null,
            process.cwd()
          ].filter(Boolean);
          const cjsPath = require.resolve("zod", { paths: searchPaths });
          zodEsmPath = cjsPath.replace(/index\.cjs$/, "index.js");
        } catch {
        }
        const zodMod = zodEsmPath ? await import(zodEsmPath).catch(() => null) : await import("zod").catch(() => null);
        if (zodMod) {
          const z = zodMod?.z || zodMod?.default?.z || zodMod;
          if (z) {
            patchZodWithRegistry(z);
            patchZodProtoForOutputTracking(z);
          }
        }
      } catch {
      }
    })();
    return _userZodEsmPatchPromise;
  }
  const cacheCount = schema ? loadCacheIntoRegistry() : 0;
  function scheduleExtraction() {
    if (extractionTimer) clearTimeout(extractionTimer);
    extractionTimer = setTimeout(doExtraction, 50);
  }
  function doExtraction() {
    if (!app) return;
    extractionTimer = null;
    const raw = extractRoutes(app);
    if (schema) {
      for (const route of raw) {
        if (!wasRouteRegistered(route.method, route.path) && route.handlers?.length) {
          onRouteRegistered(route.method, route.path, route.handlers);
        }
      }
    }
    routes = schema ? enrichRoutesWithSchemas(raw) : raw;
    wsServer?.broadcastFullSync();
  }
  const logStartup = (port = "PORT") => {
    if (portLogged) return;
    portLogged = true;
    if (routes.length === 0) {
      const raw = extractRoutes(app);
      if (schema) {
        for (const route of raw) {
          if (!wasRouteRegistered(route.method, route.path) && route.handlers?.length) {
            onRouteRegistered(route.method, route.path, route.handlers);
          }
        }
      }
      routes = schema ? enrichRoutesWithSchemas(raw) : raw;
    }
    console.log(
      `
  \x1B[36m\u25C6 nodox\x1B[0m  \x1B[2mUI \u2192\x1B[0m \x1B[4;36mhttp://localhost:${port}${uiPath}\x1B[0m`
    );
    const count = routes.length;
    const schemaCount = routes.filter(
      (r) => r.schema?.inputConfidence && r.schema.inputConfidence !== "none" || r.schema?.outputConfidence && r.schema.outputConfidence !== "none" || r.hasValidator
    ).length;
    console.log(
      `  \x1B[2m         ${count} route${count !== 1 ? "s" : ""} discovered` + (schemaCount > 0 ? `, ${schemaCount} with schema` : "") + `\x1B[0m
`
    );
  };
  function getState() {
    return { routes };
  }
  function _initWithApp(theApp) {
    if (appInitDone) return;
    appInitDone = true;
    app = theApp;
    const compat = checkExpressCompatibility(theApp);
    if (!compat.compatible) console.warn(compat.warning);
    if (typeof theApp.listen === "function") {
      const originalListen = theApp.listen;
      theApp.listen = function nodoxPatchedListen(...args) {
        const server = originalListen.apply(this, args);
        server.once("listening", async () => {
          const addr = server.address();
          const port = typeof addr === "string" ? addr : addr?.port;
          if (schema) await ensureUserZodEsmPatched();
          if (schema) await runDeferredDryRuns();
          if (schema && app) routes = enrichRoutesWithSchemas(extractRoutes(app));
          if (log && port && !portLogged) logStartup(port);
          if (!serverAttached) {
            serverAttached = true;
            wsServer = new NodoxWebSocketServer({ getState });
            wsServer.attach(server);
          }
        });
        return server;
      };
    }
    patchApp(theApp, {
      onRouteRegistered(method, path3, handlers) {
        if (schema) onRouteRegistered(method, path3, handlers);
        scheduleExtraction();
      },
      onUse() {
        scheduleExtraction();
      }
    });
    attachUiRoutes(theApp, { uiPath, getState, info });
  }
  const wasEarlyInit = !!app;
  if (wasEarlyInit) _initWithApp(app);
  if (externalServer) {
    const onListening = async () => {
      const addr = externalServer.address();
      const port = typeof addr === "string" ? addr : addr?.port;
      if (schema) await ensureUserZodEsmPatched();
      if (schema) await runDeferredDryRuns();
      if (schema && app) routes = enrichRoutesWithSchemas(extractRoutes(app));
      if (log && port && !portLogged) logStartup(port);
      if (!serverAttached) {
        serverAttached = true;
        wsServer = new NodoxWebSocketServer({ getState });
        wsServer.attach(externalServer);
      }
    };
    if (externalServer.listening) {
      onListening();
    } else {
      externalServer.once("listening", onListening);
    }
  }
  setTimeout(async () => {
    if (schema) {
      await ensureUserZodEsmPatched();
      await runDeferredDryRuns();
      if (app) routes = enrichRoutesWithSchemas(extractRoutes(app));
    }
    doExtraction();
    if (log) {
      if (app) _warnIfNoBodyParser(app);
      if (schema && cacheCount === 0 && !findCacheFile()) {
        console.log("[nodox] Run `npx nodox init` once to enable test suite schema seeding.");
      }
      const server = app?._router?.server || app?.server;
      if (server?.listening) {
        logStartup(server.address().port);
      } else if (!portLogged && app) {
        logStartup();
      }
    }
    wsServer?.broadcastFullSync();
  }, 0);
  const responseInterceptor = intercept ? createResponseInterceptor({
    parsedValueToSchema,
    onRequestBodyShape(method, routePath, shape) {
      if (!schema) return;
      onInputObserved(method, routePath, shape, "observed", () => {
        doExtraction();
        wsServer?.broadcastFullSync();
      });
    },
    onRequestQueryShape(method, routePath, shape) {
      if (!schema) return;
      onQueryObserved(method, routePath, shape, () => {
        doExtraction();
        wsServer?.broadcastFullSync();
      });
    },
    onResponseShape(method, routePath, shape, confidence) {
      if (!schema) return;
      onResponseObserved(method, routePath, shape, confidence, () => {
        doExtraction();
        wsServer?.broadcastFullSync();
      });
    }
  }) : null;
  const inlineUiHandler = !wasEarlyInit ? createUiHandler({ uiPath, getState, info }) : null;
  return function nodoxMiddleware(req, res, next) {
    if (!appInitDone && req.app) {
      _initWithApp(req.app);
      scheduleExtraction();
    }
    if (inlineUiHandler && req.path.startsWith(uiPath)) {
      return inlineUiHandler(req, res, next);
    }
    if (!serverAttached) {
      serverAttached = true;
      const httpServer = req.socket?.server;
      if (httpServer) {
        wsServer = new NodoxWebSocketServer({ getState });
        wsServer.attach(httpServer);
        if (log && !portLogged) {
          const address = httpServer.address();
          const port = typeof address === "string" ? address : address?.port;
          if (port) logStartup(port);
        }
      } else {
        console.warn("[nodox] Could not obtain HTTP server reference \u2014 WebSocket disabled.");
      }
    }
    if (responseInterceptor) responseInterceptor(req, res, () => {
    });
    next();
  };
}
function _warnIfNoBodyParser(app) {
  if (!app._router?.stack) return;
  const hasBodyParser = app._router.stack.some((layer) => {
    const name = layer.handle?.name || "";
    return ["jsonParser", "urlencodedParser", "json", "bodyParser"].includes(name);
  });
  if (!hasBodyParser) {
    console.warn(
      "[nodox] Warning: no body parser detected.\n        Add express.json() before nodox() for the playground to work.\n"
    );
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  validate
});
