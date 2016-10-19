
/*
 JSBridge大致流程:
 web调用_call,
 _call将函数push到队列_sendMessageQueue, 通知app执行_fetchQueue
 app取到任务队列,使用_handleMessageFromToutiao()执行每个任务
 _handleMessageFromToutiao会把执行结果用_setResultIframe的方式返回客户端
 */
(function(){
 // sprintf
 var sprintf = (function() {
                function get_type(variable) {
                return Object.prototype.toString.call(variable).slice(8, -1).toLowerCase();
                }
                function str_repeat(input, multiplier) {
                for (var output = []; multiplier > 0; output[--multiplier] = input) {/* do nothing */}
                return output.join('');
                }
                
                var str_format = function() {
                if (!str_format.cache.hasOwnProperty(arguments[0])) {
                str_format.cache[arguments[0]] = str_format.parse(arguments[0]);
                }
                return str_format.format.call(null, str_format.cache[arguments[0]], arguments);
                };
                
                str_format.format = function(parse_tree, argv) {
                var cursor = 1, tree_length = parse_tree.length, node_type = '', arg, output = [], i, k, match, pad, pad_character, pad_length;
                for (i = 0; i < tree_length; i++) {
                node_type = get_type(parse_tree[i]);
                if (node_type === 'string') {
                output.push(parse_tree[i]);
                }
                else if (node_type === 'array') {
                match = parse_tree[i]; // convenience purposes only
                if (match[2]) { // keyword argument
                arg = argv[cursor];
                for (k = 0; k < match[2].length; k++) {
                if (!arg.hasOwnProperty(match[2][k])) {
                throw(sprintf('[sprintf] property "%s" does not exist', match[2][k]));
                }
                arg = arg[match[2][k]];
                }
                }
                else if (match[1]) { // positional argument (explicit)
                arg = argv[match[1]];
                }
                else { // positional argument (implicit)
                arg = argv[cursor++];
                }
                
                if (/[^s]/.test(match[8]) && (get_type(arg) != 'number')) {
                throw(sprintf('[sprintf] expecting number but found %s', get_type(arg)));
                }
                switch (match[8]) {
                case 'b': arg = arg.toString(2); break;
                case 'c': arg = String.fromCharCode(arg); break;
                case 'd': arg = parseInt(arg, 10); break;
                case 'e': arg = match[7] ? arg.toExponential(match[7]) : arg.toExponential(); break;
                case 'f': arg = match[7] ? parseFloat(arg).toFixed(match[7]) : parseFloat(arg); break;
                case 'o': arg = arg.toString(8); break;
                case 's': arg = ((arg = String(arg)) && match[7] ? arg.substring(0, match[7]) : arg); break;
                case 'u': arg = Math.abs(arg); break;
                case 'x': arg = arg.toString(16); break;
                case 'X': arg = arg.toString(16).toUpperCase(); break;
                }
                arg = (/[def]/.test(match[8]) && match[3] && arg >= 0 ? '+'+ arg : arg);
                pad_character = match[4] ? match[4] == '0' ? '0' : match[4].charAt(1) : ' ';
                pad_length = match[6] - String(arg).length;
                pad = match[6] ? str_repeat(pad_character, pad_length) : '';
                output.push(match[5] ? arg + pad : pad + arg);
                }
                }
                return output.join('');
                };
                
                str_format.cache = {};
                
                str_format.parse = function(fmt) {
                var _fmt = fmt, match = [], parse_tree = [], arg_names = 0;
                while (_fmt) {
                if ((match = /^[^\x25]+/.exec(_fmt)) !== null) {
                parse_tree.push(match[0]);
                }
                else if ((match = /^\x25{2}/.exec(_fmt)) !== null) {
                parse_tree.push('%');
                }
                else if ((match = /^\x25(?:([1-9]\d*)\$|\(([^\)]+)\))?(\+)?(0|'[^$])?(-)?(\d+)?(?:\.(\d+))?([b-fosuxX])/.exec(_fmt)) !== null) {
                                                                            if (match[2]) {
                                                                            arg_names |= 1;
                                                                            var field_list = [], replacement_field = match[2], field_match = [];
                                                                            if ((field_match = /^([a-z_][a-z_\d]*)/i.exec(replacement_field)) !== null) {
                                                                            field_list.push(field_match[1]);
                                                                            while ((replacement_field = replacement_field.substring(field_match[0].length)) !== '') {
                                                                            if ((field_match = /^\.([a-z_][a-z_\d]*)/i.exec(replacement_field)) !== null) {
                                                                            field_list.push(field_match[1]);
                                                                            }
                                                                            else if ((field_match = /^\[(\d+)\]/.exec(replacement_field)) !== null) {
                                                                            field_list.push(field_match[1]);
                                                                            }
                                                                            else {
                                                                            throw('[sprintf] huh?');
                                                                            }
                                                                            }
                                                                            }
                                                                            else {
                                                                            throw('[sprintf] huh?');
                                                                            }
                                                                            match[2] = field_list;
                                                                            }
                                                                            else {
                                                                            arg_names |= 2;
                                                                            }
                                                                            if (arg_names === 3) {
                                                                            throw('[sprintf] mixing positional and named placeholders is not (yet) supported');
                                                                            }
                                                                            parse_tree.push(match);
                                                                            }
                                                                            else {
                                                                            throw('[sprintf] huh?');
                                                                            }
                                                                            _fmt = _fmt.substring(match[0].length);
                                                                            }
                                                                            return parse_tree;
                                                                            };
                                                                            
                                                                            return str_format;
                                                                            })();
                          
                          var vsprintf = function(fmt, argv) {
                          argv.unshift(fmt);
                          return sprintf.apply(null, argv);
                          };
                          
                          // UTF8
                          var UTF8 = {
                          
                          // public method for url encoding
                          encode: function(string) {
                          string = string || "";
                          string = string.replace(/\r\n/g, "\n");
                          var utftext = "";
                          
                          for (var n = 0; n < string.length; n++) {
                          
                          var c = string.charCodeAt(n);
                          
                          if (c < 128) {
                          utftext += String.fromCharCode(c);
                          } else if ((c > 127) && (c < 2048)) {
                          utftext += String.fromCharCode((c >> 6) | 192);
                          utftext += String.fromCharCode((c & 63) | 128);
                          } else {
                          utftext += String.fromCharCode((c >> 12) | 224);
                          utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                          utftext += String.fromCharCode((c & 63) | 128);
                          }
                          }
                          
                          return utftext;
                          },
                          
                          // public method for url decoding
                          decode: function(utftext) {
                          var string = "";
                          var i = 0;
                          var c = c1 = c2 = 0;
                          
                          while (i < utftext.length) {
                          
                          c = utftext.charCodeAt(i);
                          
                          if (c < 128) {
                          string += String.fromCharCode(c);
                          i++;
                          } else if ((c > 191) && (c < 224)) {
                          c2 = utftext.charCodeAt(i + 1);
                          string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
                          i += 2;
                          } else {
                          c2 = utftext.charCodeAt(i + 1);
                          c3 = utftext.charCodeAt(i + 2);
                          string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
                          i += 3;
                          }
                          
                          }
                          
                          return string;
                          }
                          };
                          
                          var HEX = {
                          encode: function(str) {
                          var r = "";
                          var e = str.length;
                          var c = 0;
                          var h;
                          while (c < e) {
                          h = str.charCodeAt(c++).toString(16);
                          while (h.length < 2) h = "0" + h;
                          r += h;
                          }
                          return r.toUpperCase();
                          },
                          
                          decode: function(str) {
                          var r = "";
                          var e = str.length;
                          var s;
                          while (e >= 0) {
                          s = e - 2;
                          r = String.fromCharCode("0x" + str.substring(s, e)) + r;
                          e = s;
                          }
                          return r;
                          }
                          };
                          
                          var JSON;
                          if (!JSON) {
                          JSON = {};
                          };
                          
                          (function() {
                           'use strict';
                           
                           function f(n) {
                           // Format integers to have at least two digits.
                           return n < 10 ? '0' + n : n;
                           }
                           
                           if (typeof Date.prototype.toJSON !== 'function') {
                           
                           Date.prototype.toJSON = function(key) {
                           
                           return isFinite(this.valueOf()) ? this.getUTCFullYear() + '-' + f(this.getUTCMonth() + 1) + '-' + f(this.getUTCDate()) + 'T' + f(this.getUTCHours()) + ':' + f(this.getUTCMinutes()) + ':' + f(this.getUTCSeconds()) + 'Z' : null;
                           };
                           
                           String.prototype.toJSON = Number.prototype.toJSON = Boolean.prototype.toJSON = function(key) {
                           return this.valueOf();
                           };
                           }
                           
                           var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
                           escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
                                         gap, indent, meta = { // table of character substitutions
                                         '\b': '\\b',
                                         '\t': '\\t',
                                         '\n': '\\n',
                                         '\f': '\\f',
                                         '\r': '\\r',
                                         '"': '\\"',
                                         '\\': '\\\\'
                                         },
                                         rep;
                                         
                                         
                                         function quote(string) {
                                         
                                         // If the string contains no control characters, no quote characters, and no
                                         // backslash characters, then we can safely slap some quotes around it.
                                         // Otherwise we must also replace the offending characters with safe escape
                                         // sequences.
                                         escapable.lastIndex = 0;
                                         return escapable.test(string) ? '"' + string.replace(escapable, function(a) {
                                                                                              var c = meta[a];
                                                                                              return typeof c === 'string' ? c : '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
                                                                                              }) + '"' : '"' + string + '"';
                                         }
                                         
                                         
                                         function str(key, holder) {
                                         
                                         // Produce a string from holder[key].
                                         var i, // The loop counter.
                                         k, // The member key.
                                         v, // The member value.
                                         length, mind = gap,
                                         partial, value = holder[key];
                                         
                                         // 有些网站如youku.com会重载了toJSON这个函数，然后返回了json转义的串，然后我们再转一次的时候就悲剧了。所以需要注掉下面这个逻辑。
                                         // Douglas Crockford一开始为什么要加这么个sb逻辑呢。 既然加了，那用了别人的方法应该直接return啊。又转一次那不是sb了吗？？？坑啊。
                                         
                                         // If the value has a toJSON method, call it to obtain a replacement value.
                                         // if (value && typeof value === 'object' && typeof value.toJSON === 'function') {
                                         //     value = value.toJSON(key);
                                         // }
                                         
                                         // If we were called with a replacer function, then call the replacer to
                                         // obtain a replacement value.
                                         if (typeof rep === 'function') {
                                         value = rep.call(holder, key, value);
                                         }
                                         
                                         // What happens next depends on the value's type.
                                         switch (typeof value) {
                                         case 'string':
                                         return quote(value);
                                         
                                         case 'number':
                                         
                                         // JSON numbers must be finite. Encode non-finite numbers as null.
                                         return isFinite(value) ? String(value) : 'null';
                                         
                                         case 'boolean':
                                         case 'null':
                                         
                                         // If the value is a boolean or null, convert it to a string. Note:
                                         // typeof null does not produce 'null'. The case is included here in
                                         // the remote chance that this gets fixed someday.
                                         return String(value);
                                         
                                         // If the type is 'object', we might be dealing with an object or an array or
                                         // null.
                                         case 'object':
                                         
                                         // Due to a specification blunder in ECMAScript, typeof null is 'object',
                                         // so watch out for that case.
                                         if (!value) {
                                         return 'null';
                                         }
                                         
                                         // Make an array to hold the partial results of stringifying this object value.
                                         gap += indent;
                                         partial = [];
                                         
                                         // Is the value an array?
                                         if (Object.prototype.toString.apply(value) === '[object Array]') {
                                         
                                         // The value is an array. Stringify every element. Use null as a placeholder
                                         // for non-JSON values.
                                         length = value.length;
                                         for (i = 0; i < length; i += 1) {
                                         partial[i] = str(i, value) || 'null';
                                         }
                                         
                                         // Join all of the elements together, separated with commas, and wrap them in
                                         // brackets.
                                         v = partial.length === 0 ? '[]' : gap ? '[\n' + gap + partial.join(',\n' + gap) + '\n' + mind + ']' : '[' + partial.join(',') + ']';
                                         gap = mind;
                                         return v;
                                         }
                                         
                                         // If the replacer is an array, use it to select the members to be stringified.
                                         if (rep && typeof rep === 'object') {
                                         length = rep.length;
                                         for (i = 0; i < length; i += 1) {
                                         if (typeof rep[i] === 'string') {
                                         k = rep[i];
                                         v = str(k, value);
                                         if (v) {
                                         partial.push(quote(k) + (gap ? ': ' : ':') + v);
                                         }
                                         }
                                         }
                                         } else {
                                         
                                         // Otherwise, iterate through all of the keys in the object.
                                         for (k in value) {
                                         if (Object.prototype.hasOwnProperty.call(value, k)) {
                                         v = str(k, value);
                                         if (v) {
                                         partial.push(quote(k) + (gap ? ': ' : ':') + v);
                                         }
                                         }
                                         }
                                         }
                                         
                                         // Join all of the member texts together, separated with commas,
                                         // and wrap them in braces.
                                         v = partial.length === 0 ? '{}' : gap ? '{\n' + gap + partial.join(',\n' + gap) + '\n' + mind + '}' : '{' + partial.join(',') + '}';
                                         gap = mind;
                                         return v;
                                         }
                                         }
                                         
                                         // If the JSON object does not yet have a stringify method, give it one.
                                         if (typeof JSON.stringify !== 'function') {
                                         JSON.stringify = function(value, replacer, space) {
                                         
                                         // The stringify method takes a value and an optional replacer, and an optional
                                         // space parameter, and returns a JSON text. The replacer can be a function
                                         // that can replace values, or an array of strings that will select the keys.
                                         // A default replacer method can be provided. Use of the space parameter can
                                         // produce text that is more easily readable.
                                         var i;
                                         gap = '';
                                         indent = '';
                                         
                                         // If the space parameter is a number, make an indent string containing that
                                         // many spaces.
                                         if (typeof space === 'number') {
                                         for (i = 0; i < space; i += 1) {
                                         indent += ' ';
                                         }
                                         
                                         // If the space parameter is a string, it will be used as the indent string.
                                         } else if (typeof space === 'string') {
                                         indent = space;
                                         }
                                         
                                         // If there is a replacer, it must be a function or an array.
                                         // Otherwise, throw an error.
                                         rep = replacer;
                                         if (replacer && typeof replacer !== 'function' && (typeof replacer !== 'object' || typeof replacer.length !== 'number')) {
                                         throw new Error('JSON.stringify');
                                         }
                                         
                                         // Make a fake root object containing our value under the key of ''.
                                         // Return the result of stringifying the value.
                                         return str('', {
                                                    '': value
                                                    });
                                         };
                                         }
                                         
                                         
                                         // If the JSON object does not yet have a parse method, give it one.
                                         if (typeof JSON.parse !== 'function') {
                                         JSON.parse = function(text, reviver) {
                                         
                                         // The parse method takes a text and an optional reviver function, and returns
                                         // a JavaScript value if the text is a valid JSON text.
                                         var j;
                                         
                                         function walk(holder, key) {
                                         
                                         // The walk method is used to recursively walk the resulting structure so
                                         // that modifications can be made.
                                         var k, v, value = holder[key];
                                         if (value && typeof value === 'object') {
                                         for (k in value) {
                                         if (Object.prototype.hasOwnProperty.call(value, k)) {
                                         v = walk(value, k);
                                         if (v !== undefined) {
                                         value[k] = v;
                                         } else {
                                         delete value[k];
                                         }
                                         }
                                         }
                                         }
                                         return reviver.call(holder, key, value);
                                         }
                                         
                                         
                                         // Parsing happens in four stages. In the first stage, we replace certain
                                         // Unicode characters with escape sequences. JavaScript handles many characters
                                         // incorrectly, either silently deleting them, or treating them as line endings.
                                         text = String(text);
                                         cx.lastIndex = 0;
                                         if (cx.test(text)) {
                                         text = text.replace(cx, function(a) {
                                                             return '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
                                                             });
                                         }
                                         
                                         // In the second stage, we run the text against regular expressions that look
                                         // for non-JSON patterns. We are especially concerned with '()' and 'new'
                                         // because they can cause invocation, and '=' because it can cause mutation.
                                         // But just to be safe, we want to reject all unexpected forms.
                                         // We split the second stage into 4 regexp operations in order to work around
                                         // crippling inefficiencies in IE's and Safari's regexp engines. First we
                                         // replace the JSON backslash pairs with '@' (a non-JSON character). Second, we
                                         // replace all simple value tokens with ']' characters. Third, we delete all
                                         // open brackets that follow a colon or comma or that begin the text. Finally,
                                         // we look to see that the remaining characters are only whitespace or ']' or
                                         // ',' or ':' or '{' or '}'. If that is so, then the text is safe for eval.
                                         if (/^[\],:{}\s]*$/.test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@').replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']').replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {
                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                      // In the third stage we use the eval function to compile the text into a
                                                                                                                                                                                                                                      // JavaScript structure. The '{' operator is subject to a syntactic ambiguity
                                                                                                                                                                                                                                      // in JavaScript: it can begin a block or an object literal. We wrap the text
                                                                                                                                                                                                                                      // in parens to eliminate the ambiguity.
                                                                                                                                                                                                                                      j = eval('(' + text + ')');
                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                      // In the optional fourth stage, we recursively walk the new structure, passing
                                                                                                                                                                                                                                      // each name/value pair to a reviver function for possible transformation.
                                                                                                                                                                                                                                      return typeof reviver === 'function' ? walk({
                                                                                                                                                                                                                                                                                  '': j
                                                                                                                                                                                                                                                                                  }, '') : j;
                                                                                                                                                                                                                                      }
                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                      // If the text is not JSON parseable, then a SyntaxError is thrown.
                                                                                                                                                                                                                                      throw new SyntaxError('JSON.parse');
                                                                                                                                                                                                                                      };
                                                                                                                                                                                                                                      }
                                                                                                                                                                                                                                      }());
                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                      var base64encodechars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                      function base64encode(str) {
                                                                                                                                                                                                                                      if (str === undefined) {
                                                                                                                                                                                                                                      return str;
                                                                                                                                                                                                                                      }
                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                      var out, i, len;
                                                                                                                                                                                                                                      var c1, c2, c3;
                                                                                                                                                                                                                                      len = str.length;
                                                                                                                                                                                                                                      i = 0;
                                                                                                                                                                                                                                      out = "";
                                                                                                                                                                                                                                      while (i < len) {
                                                                                                                                                                                                                                      c1 = str.charCodeAt(i++) & 0xff;
                                                                                                                                                                                                                                      if (i == len) {
                                                                                                                                                                                                                                      out += base64encodechars.charAt(c1 >> 2);
                                                                                                                                                                                                                                      out += base64encodechars.charAt((c1 & 0x3) << 4);
                                                                                                                                                                                                                                      out += "==";
                                                                                                                                                                                                                                      break;
                                                                                                                                                                                                                                      }
                                                                                                                                                                                                                                      c2 = str.charCodeAt(i++);
                                                                                                                                                                                                                                      if (i == len) {
                                                                                                                                                                                                                                      out += base64encodechars.charAt(c1 >> 2);
                                                                                                                                                                                                                                      out += base64encodechars.charAt(((c1 & 0x3) << 4) | ((c2 & 0xf0) >> 4));
                                                                                                                                                                                                                                      out += base64encodechars.charAt((c2 & 0xf) << 2);
                                                                                                                                                                                                                                      out += "=";
                                                                                                                                                                                                                                      break;
                                                                                                                                                                                                                                      }
                                                                                                                                                                                                                                      c3 = str.charCodeAt(i++);
                                                                                                                                                                                                                                      out += base64encodechars.charAt(c1 >> 2);
                                                                                                                                                                                                                                      out += base64encodechars.charAt(((c1 & 0x3) << 4) | ((c2 & 0xf0) >> 4));
                                                                                                                                                                                                                                      out += base64encodechars.charAt(((c2 & 0xf) << 2) | ((c3 & 0xc0) >> 6));
                                                                                                                                                                                                                                      out += base64encodechars.charAt(c3 & 0x3f);
                                                                                                                                                                                                                                      }
                                                                                                                                                                                                                                      return out;
                                                                                                                                                                                                                                      };
                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                      function isEmptyObject( obj ) {
                                                                                                                                                                                                                                      for ( var name in obj ) {
                                                                                                                                                                                                                                      return false;
                                                                                                                                                                                                                                      };
                                                                                                                                                                                                                                      return true;
                                                                                                                                                                                                                                      };
                                                                                                                                                                                                                                      //工具函数结束
                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                      function _revertArgs(key,params){
                                                                                                                                                                                                                                      var min_image_size = 100;
                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                      if(key == "gallery"){
                                                                                                                                                                                                                                      var imgs = params['images'];
                                                                                                                                                                                                                                      if(imgs){
                                                                                                                                                                                                                                      var result = [];
                                                                                                                                                                                                                                      imgs.forEach(function(ele){
                                                                                                                                                                                                                                                   if(typeof ele == "string") result.push({
                                                                                                                                                                                                                                                                                          url_list: [{ url: ele  }]
                                                                                                                                                                                                                                                                                          })
                                                                                                                                                                                                                                                   });
                                                                                                                                                                                                                                      params['image_list'] = result;
                                                                                                                                                                                                                                      params['uri'] = imgs[0]
                                                                                                                                                                                                                                      };
                                                                                                                                                                                                                                      return params;
                                                                                                                                                                                                                                      };
                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                      if(key == "share"){
                                                                                                                                                                                                                                      if(params && !isEmptyObject(params)) return params;
                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                      var title = "",
                                                                                                                                                                                                                                      desc = "",
                                                                                                                                                                                                                                      icon = "",
                                                                                                                                                                                                                                      title_ele = document.querySelector("title"),
                                                                                                                                                                                                                                      desc_ele = document.querySelector("meta[name=description]"),
                                                                                                                                                                                                                                      apple_touch_icon_ele = document.querySelector("link[rel*=apple-touch-icon]"),
                                                                                                                                                                                                                                      rel_icon_ele = document.querySelector("link[rel*=shortcut]");
                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                      if(title_ele) title = title_ele.innerText;
                                                                                                                                                                                                                                      if(desc_ele) desc = desc_ele.content;
                                                                                                                                                                                                                                      if(rel_icon_ele) icon = rel_icon_ele.href;
                                                                                                                                                                                                                                      if(apple_touch_icon_ele) icon = apple_touch_icon_ele.href;
                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                      if(!icon){
                                                                                                                                                                                                                                      var imgs = document.querySelectorAll("body img");
                                                                                                                                                                                                                                      for(var i = 0; i<imgs.length; i++){
                                                                                                                                                                                                                                      var img = imgs[i];
                                                                                                                                                                                                                                      if(img.naturalWidth > min_image_size && img.naturalWidth > min_image_size){
                                                                                                                                                                                                                                      icon = img.src;
                                                                                                                                                                                                                                      break;
                                                                                                                                                                                                                                      };
                                                                                                                                                                                                                                      }
                                                                                                                                                                                                                                      };
                                                                                                                                                                                                                                      return {
                                                                                                                                                                                                                                      "platform" : "weixin_moments",
                                                                                                                                                                                                                                      "url"      : location.href,
                                                                                                                                                                                                                                      "title"    : title,
                                                                                                                                                                                                                                      "desc"     : desc,
                                                                                                                                                                                                                                      "image"    : icon
                                                                                                                                                                                                                                      }
                                                                                                                                                                                                                                      };
                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                      return params;
                                                                                                                                                                                                                                      };
                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                      var _sendMessageQueue = [],
                                                                                                                                                                                                                                      _receiveMessageQueue = [],
                                                                                                                                                                                                                                      _callback_count = 1000,
                                                                                                                                                                                                                                      _callback_map = {},
                                                                                                                                                                                                                                      _event_hook_map = {},
                                                                                                                                                                                                                                      _session_data = {},
                                                                                                                                                                                                                                      _readyMessageIframe,  //call方法被调用时,会修改其src 为 bytedance://dispatch_message/, 告知app执行_fetchQueue
                                                                                                                                                                                                                                      _setResultIframe,     //返回值通过修改该iframe src实现
                                                                                                                                                                                                                                      _CUSTOM_PROTOCOL_SCHEME = 'bytedance://';
                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                      //web: 创建iframe的准备队列
                                                                                                                                                                                                                                      function _createQueueReadyIframe() {
                                                                                                                                                                                                                                      _setResultIframe = document.createElement('iframe');
                                                                                                                                                                                                                                      _setResultIframe.id = '__ToutiaoJSBridgeIframe_SetResult';
                                                                                                                                                                                                                                      _setResultIframe.style.display = 'none';
                                                                                                                                                                                                                                      document.documentElement.appendChild(_setResultIframe);
                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                      _readyMessageIframe = document.createElement('iframe');
                                                                                                                                                                                                                                      _readyMessageIframe.id = '__ToutiaoJSBridgeIframe';
                                                                                                                                                                                                                                      _readyMessageIframe.style.display = 'none';
                                                                                                                                                                                                                                      document.documentElement.appendChild(_readyMessageIframe);
                                                                                                                                                                                                                                      };
                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                      //app->web:取出队列中的消息，并清空接收队列
                                                                                                                                                                                                                                      function _fetchQueue() {
                                                                                                                                                                                                                                      var messageQueueString = JSON.stringify(_sendMessageQueue);
                                                                                                                                                                                                                                      _sendMessageQueue = [];
                                                                                                                                                                                                                                      _setResultValue('SCENE_FETCHQUEUE', messageQueueString);
                                                                                                                                                                                                                                      return messageQueueString;
                                                                                                                                                                                                                                      };
                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                      //app->web:执行JS函数,并将结果返回客户端
                                                                                                                                                                                                                                      function _handleMessageFromToutiao(message) {
                                                                                                                                                                                                                                      var msg_type = message['__msg_type'],
                                                                                                                                                                                                                                      msg_params = message['__params'],
                                                                                                                                                                                                                                      msg_event_id = message['__event_id'],
                                                                                                                                                                                                                                      msg_callback_id = message['__callback_id'],
                                                                                                                                                                                                                                      ret;
                                                                                                                                                                                                                                      if(msg_type == 'callback'){
                                                                                                                                                                                                                                      ret = {'__err_code':'cb404'};
                                                                                                                                                                                                                                      if(typeof msg_callback_id === 'string' && typeof _callback_map[msg_callback_id] === 'function'){
                                                                                                                                                                                                                                      ret = _callback_map[msg_callback_id](msg_params);
                                                                                                                                                                                                                                      delete _callback_map[msg_callback_id];
                                                                                                                                                                                                                                      };
                                                                                                                                                                                                                                      }else if(msg_type == 'event'){
                                                                                                                                                                                                                                      ret = {'__err_code':'ev404'};
                                                                                                                                                                                                                                      if(typeof msg_event_id === 'string' && typeof _event_hook_map[msg_event_id] === 'function'){
                                                                                                                                                                                                                                      ret = _event_hook_map[msg_event_id](msg_params);
                                                                                                                                                                                                                                      }
                                                                                                                                                                                                                                      };
                                                                                                                                                                                                                                      _setResultValue('SCENE_HANDLEMSGFROMTT', JSON.stringify(ret));
                                                                                                                                                                                                                                      return JSON.stringify(ret);
                                                                                                                                                                                                                                      };
                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                      function _setResultValue(scene, result){
                                                                                                                                                                                                                                      //+result id待添加
                                                                                                                                                                                                                                      _setResultIframe.src = _CUSTOM_PROTOCOL_SCHEME+'private/setresult/' + scene + '&' + base64encode(UTF8.encode(result));
                                                                                                                                                                                                                                      };
                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                      function _env(key) {
                                                                                                                                                                                                                                      return _session_data[key];
                                                                                                                                                                                                                                      };
                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                      function _log(fmt) {
                                                                                                                                                                                                                                      var argv = [];
                                                                                                                                                                                                                                      for (var i = 0; i < arguments.length; i++) {
                                                                                                                                                                                                                                      argv.push(arguments[i]);
                                                                                                                                                                                                                                      };
                                                                                                                                                                                                                                      var fm = argv.shift();
                                                                                                                                                                                                                                      var msg;
                                                                                                                                                                                                                                      try {
                                                                                                                                                                                                                                      msg = vsprintf(fm,argv);
                                                                                                                                                                                                                                      }catch(e) {
                                                                                                                                                                                                                                      msg = fmt;
                                                                                                                                                                                                                                      }
                                                                                                                                                                                                                                      _call('log',{'msg':msg});
                                                                                                                                                                                                                                      };
                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                      //web->app: 将客户端功能push到队列,告诉客户端有新任务,等待客户端 _fetchQueue
                                                                                                                                                                                                                                      function _call(func,params,callback) {
                                                                                                                                                                                                                                      if (!func || typeof func !== 'string') return;
                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                      if (typeof params !== 'object')  params = {};
                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                      params = _revertArgs(func,params);
                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                      var callbackID = (_callback_count++).toString();
                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                      if (typeof callback === 'function') _callback_map[callbackID] = callback;
                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                      var _msg_string = {
                                                                                                                                                                                                                                      'func'          : func,
                                                                                                                                                                                                                                      'params'        : params,
                                                                                                                                                                                                                                      '__msg_type'    : 'call',
                                                                                                                                                                                                                                      '__callback_id' : callbackID
                                                                                                                                                                                                                                      };
                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                      //将消息添加到发送队列，iframe的准备队列为bytedance://dispatch_message/
                                                                                                                                                                                                                                      _sendMessageQueue.push(_msg_string);
                                                                                                                                                                                                                                      _readyMessageIframe.src = _CUSTOM_PROTOCOL_SCHEME + 'dispatch_message/';
                                                                                                                                                                                                                                      };
                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                      //web: 自定义事件和回调,如"sys:bridged"
                                                                                                                                                                                                                                      function _on(event,callback){
                                                                                                                                                                                                                                      if (!event || typeof event !== 'string' || typeof callback !== 'function') return;
                                                                                                                                                                                                                                      _event_hook_map[event] = callback;
                                                                                                                                                                                                                                      _call("addEventListener", {name : event}, null);
                                                                                                                                                                                                                                      };
                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                      function _trigger(event,argv) {
                                                                                                                                                                                                                                      if (typeof _event_hook_map[event] !== 'function') return;
                                                                                                                                                                                                                                      _event_hook_map[event](argv);
                                                                                                                                                                                                                                      };
                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                      function _setDefaultEventHandlers() {
                                                                                                                                                                                                                                      _on('sys:bridged',function(ses){
                                                                                                                                                                                                                                          if (window.ToutiaoJSBridge._hasInit) {
                                                                                                                                                                                                                                          _log('hasInit, no need to init again');
                                                                                                                                                                                                                                          return;
                                                                                                                                                                                                                                          }
                                                                                                                                                                                                                                          
                                                                                                                                                                                                                                          window.ToutiaoJSBridge._hasInit = true;
                                                                                                                                                                                                                                          
                                                                                                                                                                                                                                          _session_data = ses;
                                                                                                                                                                                                                                          
                                                                                                                                                                                                                                          // bridge ready
                                                                                                                                                                                                                                          var readyEvent = document.createEvent('Events');
                                                                                                                                                                                                                                          readyEvent.initEvent('ToutiaoJSBridgeReady');
                                                                                                                                                                                                                                          document.dispatchEvent(readyEvent);
                                                                                                                                                                                                                                          })
                                                                                                                                                                                                                                      };
                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                      window.ToutiaoJSBridge = {
                                                                                                                                                                                                                                      call:_call,
                                                                                                                                                                                                                                      on:_on,
                                                                                                                                                                                                                                      env:_env,
                                                                                                                                                                                                                                      trigger: _trigger,
                                                                                                                                                                                                                                      log:_log,
                                                                                                                                                                                                                                      _fetchQueue: _fetchQueue,
                                                                                                                                                                                                                                      _handleMessageFromToutiao: _handleMessageFromToutiao,
                                                                                                                                                                                                                                      _hasInit: false
                                                                                                                                                                                                                                      };
                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                      _createQueueReadyIframe();
                                                                                                                                                                                                                                      _setDefaultEventHandlers();
                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                      })();