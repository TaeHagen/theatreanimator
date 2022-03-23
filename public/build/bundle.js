
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop$1() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    let src_url_equal_anchor;
    function src_url_equal(element_src, url) {
        if (!src_url_equal_anchor) {
            src_url_equal_anchor = document.createElement('a');
        }
        src_url_equal_anchor.href = url;
        return element_src === src_url_equal_anchor.href;
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function null_to_empty(value) {
        return value == null ? '' : value;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function to_number(value) {
        return value === '' ? null : +value;
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function set_style(node, key, value, important) {
        if (value === null) {
            node.style.removeProperty(key);
        }
        else {
            node.style.setProperty(key, value, important ? 'important' : '');
        }
    }
    function select_option(select, value) {
        for (let i = 0; i < select.options.length; i += 1) {
            const option = select.options[i];
            if (option.__value === value) {
                option.selected = true;
                return;
            }
        }
        select.selectedIndex = -1; // no option should be selected
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop$1,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop$1;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.46.4' }, detail), true));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev('SvelteDOMSetProperty', { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */
    /* global Reflect, Promise */

    var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };

    function __extends(d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    }

    function __values(o) {
        var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
        if (m) return m.call(o);
        if (o && typeof o.length === "number") return {
            next: function () {
                if (o && i >= o.length) o = void 0;
                return { value: o && o[i++], done: !o };
            }
        };
        throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
    }

    function __read(o, n) {
        var m = typeof Symbol === "function" && o[Symbol.iterator];
        if (!m) return o;
        var i = m.call(o), r, ar = [], e;
        try {
            while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
        }
        catch (error) { e = { error: error }; }
        finally {
            try {
                if (r && !r.done && (m = i["return"])) m.call(i);
            }
            finally { if (e) throw e.error; }
        }
        return ar;
    }

    function __spreadArray(to, from, pack) {
        if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
            if (ar || !(i in from)) {
                if (!ar) ar = Array.prototype.slice.call(from, 0, i);
                ar[i] = from[i];
            }
        }
        return to.concat(ar || Array.prototype.slice.call(from));
    }

    function isFunction(value) {
        return typeof value === 'function';
    }

    function createErrorClass(createImpl) {
        var _super = function (instance) {
            Error.call(instance);
            instance.stack = new Error().stack;
        };
        var ctorFunc = createImpl(_super);
        ctorFunc.prototype = Object.create(Error.prototype);
        ctorFunc.prototype.constructor = ctorFunc;
        return ctorFunc;
    }

    var UnsubscriptionError = createErrorClass(function (_super) {
        return function UnsubscriptionErrorImpl(errors) {
            _super(this);
            this.message = errors
                ? errors.length + " errors occurred during unsubscription:\n" + errors.map(function (err, i) { return i + 1 + ") " + err.toString(); }).join('\n  ')
                : '';
            this.name = 'UnsubscriptionError';
            this.errors = errors;
        };
    });

    function arrRemove(arr, item) {
        if (arr) {
            var index = arr.indexOf(item);
            0 <= index && arr.splice(index, 1);
        }
    }

    var Subscription = (function () {
        function Subscription(initialTeardown) {
            this.initialTeardown = initialTeardown;
            this.closed = false;
            this._parentage = null;
            this._finalizers = null;
        }
        Subscription.prototype.unsubscribe = function () {
            var e_1, _a, e_2, _b;
            var errors;
            if (!this.closed) {
                this.closed = true;
                var _parentage = this._parentage;
                if (_parentage) {
                    this._parentage = null;
                    if (Array.isArray(_parentage)) {
                        try {
                            for (var _parentage_1 = __values(_parentage), _parentage_1_1 = _parentage_1.next(); !_parentage_1_1.done; _parentage_1_1 = _parentage_1.next()) {
                                var parent_1 = _parentage_1_1.value;
                                parent_1.remove(this);
                            }
                        }
                        catch (e_1_1) { e_1 = { error: e_1_1 }; }
                        finally {
                            try {
                                if (_parentage_1_1 && !_parentage_1_1.done && (_a = _parentage_1.return)) _a.call(_parentage_1);
                            }
                            finally { if (e_1) throw e_1.error; }
                        }
                    }
                    else {
                        _parentage.remove(this);
                    }
                }
                var initialFinalizer = this.initialTeardown;
                if (isFunction(initialFinalizer)) {
                    try {
                        initialFinalizer();
                    }
                    catch (e) {
                        errors = e instanceof UnsubscriptionError ? e.errors : [e];
                    }
                }
                var _finalizers = this._finalizers;
                if (_finalizers) {
                    this._finalizers = null;
                    try {
                        for (var _finalizers_1 = __values(_finalizers), _finalizers_1_1 = _finalizers_1.next(); !_finalizers_1_1.done; _finalizers_1_1 = _finalizers_1.next()) {
                            var finalizer = _finalizers_1_1.value;
                            try {
                                execFinalizer(finalizer);
                            }
                            catch (err) {
                                errors = errors !== null && errors !== void 0 ? errors : [];
                                if (err instanceof UnsubscriptionError) {
                                    errors = __spreadArray(__spreadArray([], __read(errors)), __read(err.errors));
                                }
                                else {
                                    errors.push(err);
                                }
                            }
                        }
                    }
                    catch (e_2_1) { e_2 = { error: e_2_1 }; }
                    finally {
                        try {
                            if (_finalizers_1_1 && !_finalizers_1_1.done && (_b = _finalizers_1.return)) _b.call(_finalizers_1);
                        }
                        finally { if (e_2) throw e_2.error; }
                    }
                }
                if (errors) {
                    throw new UnsubscriptionError(errors);
                }
            }
        };
        Subscription.prototype.add = function (teardown) {
            var _a;
            if (teardown && teardown !== this) {
                if (this.closed) {
                    execFinalizer(teardown);
                }
                else {
                    if (teardown instanceof Subscription) {
                        if (teardown.closed || teardown._hasParent(this)) {
                            return;
                        }
                        teardown._addParent(this);
                    }
                    (this._finalizers = (_a = this._finalizers) !== null && _a !== void 0 ? _a : []).push(teardown);
                }
            }
        };
        Subscription.prototype._hasParent = function (parent) {
            var _parentage = this._parentage;
            return _parentage === parent || (Array.isArray(_parentage) && _parentage.includes(parent));
        };
        Subscription.prototype._addParent = function (parent) {
            var _parentage = this._parentage;
            this._parentage = Array.isArray(_parentage) ? (_parentage.push(parent), _parentage) : _parentage ? [_parentage, parent] : parent;
        };
        Subscription.prototype._removeParent = function (parent) {
            var _parentage = this._parentage;
            if (_parentage === parent) {
                this._parentage = null;
            }
            else if (Array.isArray(_parentage)) {
                arrRemove(_parentage, parent);
            }
        };
        Subscription.prototype.remove = function (teardown) {
            var _finalizers = this._finalizers;
            _finalizers && arrRemove(_finalizers, teardown);
            if (teardown instanceof Subscription) {
                teardown._removeParent(this);
            }
        };
        Subscription.EMPTY = (function () {
            var empty = new Subscription();
            empty.closed = true;
            return empty;
        })();
        return Subscription;
    }());
    var EMPTY_SUBSCRIPTION = Subscription.EMPTY;
    function isSubscription(value) {
        return (value instanceof Subscription ||
            (value && 'closed' in value && isFunction(value.remove) && isFunction(value.add) && isFunction(value.unsubscribe)));
    }
    function execFinalizer(finalizer) {
        if (isFunction(finalizer)) {
            finalizer();
        }
        else {
            finalizer.unsubscribe();
        }
    }

    var config = {
        onUnhandledError: null,
        onStoppedNotification: null,
        Promise: undefined,
        useDeprecatedSynchronousErrorHandling: false,
        useDeprecatedNextContext: false,
    };

    var timeoutProvider = {
        setTimeout: function (handler, timeout) {
            var args = [];
            for (var _i = 2; _i < arguments.length; _i++) {
                args[_i - 2] = arguments[_i];
            }
            var delegate = timeoutProvider.delegate;
            if (delegate === null || delegate === void 0 ? void 0 : delegate.setTimeout) {
                return delegate.setTimeout.apply(delegate, __spreadArray([handler, timeout], __read(args)));
            }
            return setTimeout.apply(void 0, __spreadArray([handler, timeout], __read(args)));
        },
        clearTimeout: function (handle) {
            var delegate = timeoutProvider.delegate;
            return ((delegate === null || delegate === void 0 ? void 0 : delegate.clearTimeout) || clearTimeout)(handle);
        },
        delegate: undefined,
    };

    function reportUnhandledError(err) {
        timeoutProvider.setTimeout(function () {
            {
                throw err;
            }
        });
    }

    function noop() { }

    var context = null;
    function errorContext(cb) {
        if (config.useDeprecatedSynchronousErrorHandling) {
            var isRoot = !context;
            if (isRoot) {
                context = { errorThrown: false, error: null };
            }
            cb();
            if (isRoot) {
                var _a = context, errorThrown = _a.errorThrown, error = _a.error;
                context = null;
                if (errorThrown) {
                    throw error;
                }
            }
        }
        else {
            cb();
        }
    }

    var Subscriber = (function (_super) {
        __extends(Subscriber, _super);
        function Subscriber(destination) {
            var _this = _super.call(this) || this;
            _this.isStopped = false;
            if (destination) {
                _this.destination = destination;
                if (isSubscription(destination)) {
                    destination.add(_this);
                }
            }
            else {
                _this.destination = EMPTY_OBSERVER;
            }
            return _this;
        }
        Subscriber.create = function (next, error, complete) {
            return new SafeSubscriber(next, error, complete);
        };
        Subscriber.prototype.next = function (value) {
            if (this.isStopped) ;
            else {
                this._next(value);
            }
        };
        Subscriber.prototype.error = function (err) {
            if (this.isStopped) ;
            else {
                this.isStopped = true;
                this._error(err);
            }
        };
        Subscriber.prototype.complete = function () {
            if (this.isStopped) ;
            else {
                this.isStopped = true;
                this._complete();
            }
        };
        Subscriber.prototype.unsubscribe = function () {
            if (!this.closed) {
                this.isStopped = true;
                _super.prototype.unsubscribe.call(this);
                this.destination = null;
            }
        };
        Subscriber.prototype._next = function (value) {
            this.destination.next(value);
        };
        Subscriber.prototype._error = function (err) {
            try {
                this.destination.error(err);
            }
            finally {
                this.unsubscribe();
            }
        };
        Subscriber.prototype._complete = function () {
            try {
                this.destination.complete();
            }
            finally {
                this.unsubscribe();
            }
        };
        return Subscriber;
    }(Subscription));
    var _bind = Function.prototype.bind;
    function bind(fn, thisArg) {
        return _bind.call(fn, thisArg);
    }
    var ConsumerObserver = (function () {
        function ConsumerObserver(partialObserver) {
            this.partialObserver = partialObserver;
        }
        ConsumerObserver.prototype.next = function (value) {
            var partialObserver = this.partialObserver;
            if (partialObserver.next) {
                try {
                    partialObserver.next(value);
                }
                catch (error) {
                    handleUnhandledError(error);
                }
            }
        };
        ConsumerObserver.prototype.error = function (err) {
            var partialObserver = this.partialObserver;
            if (partialObserver.error) {
                try {
                    partialObserver.error(err);
                }
                catch (error) {
                    handleUnhandledError(error);
                }
            }
            else {
                handleUnhandledError(err);
            }
        };
        ConsumerObserver.prototype.complete = function () {
            var partialObserver = this.partialObserver;
            if (partialObserver.complete) {
                try {
                    partialObserver.complete();
                }
                catch (error) {
                    handleUnhandledError(error);
                }
            }
        };
        return ConsumerObserver;
    }());
    var SafeSubscriber = (function (_super) {
        __extends(SafeSubscriber, _super);
        function SafeSubscriber(observerOrNext, error, complete) {
            var _this = _super.call(this) || this;
            var partialObserver;
            if (isFunction(observerOrNext) || !observerOrNext) {
                partialObserver = {
                    next: observerOrNext !== null && observerOrNext !== void 0 ? observerOrNext : undefined,
                    error: error !== null && error !== void 0 ? error : undefined,
                    complete: complete !== null && complete !== void 0 ? complete : undefined,
                };
            }
            else {
                var context_1;
                if (_this && config.useDeprecatedNextContext) {
                    context_1 = Object.create(observerOrNext);
                    context_1.unsubscribe = function () { return _this.unsubscribe(); };
                    partialObserver = {
                        next: observerOrNext.next && bind(observerOrNext.next, context_1),
                        error: observerOrNext.error && bind(observerOrNext.error, context_1),
                        complete: observerOrNext.complete && bind(observerOrNext.complete, context_1),
                    };
                }
                else {
                    partialObserver = observerOrNext;
                }
            }
            _this.destination = new ConsumerObserver(partialObserver);
            return _this;
        }
        return SafeSubscriber;
    }(Subscriber));
    function handleUnhandledError(error) {
        {
            reportUnhandledError(error);
        }
    }
    function defaultErrorHandler(err) {
        throw err;
    }
    var EMPTY_OBSERVER = {
        closed: true,
        next: noop,
        error: defaultErrorHandler,
        complete: noop,
    };

    var observable = (function () { return (typeof Symbol === 'function' && Symbol.observable) || '@@observable'; })();

    function identity(x) {
        return x;
    }

    function pipeFromArray(fns) {
        if (fns.length === 0) {
            return identity;
        }
        if (fns.length === 1) {
            return fns[0];
        }
        return function piped(input) {
            return fns.reduce(function (prev, fn) { return fn(prev); }, input);
        };
    }

    var Observable = (function () {
        function Observable(subscribe) {
            if (subscribe) {
                this._subscribe = subscribe;
            }
        }
        Observable.prototype.lift = function (operator) {
            var observable = new Observable();
            observable.source = this;
            observable.operator = operator;
            return observable;
        };
        Observable.prototype.subscribe = function (observerOrNext, error, complete) {
            var _this = this;
            var subscriber = isSubscriber(observerOrNext) ? observerOrNext : new SafeSubscriber(observerOrNext, error, complete);
            errorContext(function () {
                var _a = _this, operator = _a.operator, source = _a.source;
                subscriber.add(operator
                    ?
                        operator.call(subscriber, source)
                    : source
                        ?
                            _this._subscribe(subscriber)
                        :
                            _this._trySubscribe(subscriber));
            });
            return subscriber;
        };
        Observable.prototype._trySubscribe = function (sink) {
            try {
                return this._subscribe(sink);
            }
            catch (err) {
                sink.error(err);
            }
        };
        Observable.prototype.forEach = function (next, promiseCtor) {
            var _this = this;
            promiseCtor = getPromiseCtor(promiseCtor);
            return new promiseCtor(function (resolve, reject) {
                var subscriber = new SafeSubscriber({
                    next: function (value) {
                        try {
                            next(value);
                        }
                        catch (err) {
                            reject(err);
                            subscriber.unsubscribe();
                        }
                    },
                    error: reject,
                    complete: resolve,
                });
                _this.subscribe(subscriber);
            });
        };
        Observable.prototype._subscribe = function (subscriber) {
            var _a;
            return (_a = this.source) === null || _a === void 0 ? void 0 : _a.subscribe(subscriber);
        };
        Observable.prototype[observable] = function () {
            return this;
        };
        Observable.prototype.pipe = function () {
            var operations = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                operations[_i] = arguments[_i];
            }
            return pipeFromArray(operations)(this);
        };
        Observable.prototype.toPromise = function (promiseCtor) {
            var _this = this;
            promiseCtor = getPromiseCtor(promiseCtor);
            return new promiseCtor(function (resolve, reject) {
                var value;
                _this.subscribe(function (x) { return (value = x); }, function (err) { return reject(err); }, function () { return resolve(value); });
            });
        };
        Observable.create = function (subscribe) {
            return new Observable(subscribe);
        };
        return Observable;
    }());
    function getPromiseCtor(promiseCtor) {
        var _a;
        return (_a = promiseCtor !== null && promiseCtor !== void 0 ? promiseCtor : config.Promise) !== null && _a !== void 0 ? _a : Promise;
    }
    function isObserver(value) {
        return value && isFunction(value.next) && isFunction(value.error) && isFunction(value.complete);
    }
    function isSubscriber(value) {
        return (value && value instanceof Subscriber) || (isObserver(value) && isSubscription(value));
    }

    var ObjectUnsubscribedError = createErrorClass(function (_super) {
        return function ObjectUnsubscribedErrorImpl() {
            _super(this);
            this.name = 'ObjectUnsubscribedError';
            this.message = 'object unsubscribed';
        };
    });

    var Subject = (function (_super) {
        __extends(Subject, _super);
        function Subject() {
            var _this = _super.call(this) || this;
            _this.closed = false;
            _this.currentObservers = null;
            _this.observers = [];
            _this.isStopped = false;
            _this.hasError = false;
            _this.thrownError = null;
            return _this;
        }
        Subject.prototype.lift = function (operator) {
            var subject = new AnonymousSubject(this, this);
            subject.operator = operator;
            return subject;
        };
        Subject.prototype._throwIfClosed = function () {
            if (this.closed) {
                throw new ObjectUnsubscribedError();
            }
        };
        Subject.prototype.next = function (value) {
            var _this = this;
            errorContext(function () {
                var e_1, _a;
                _this._throwIfClosed();
                if (!_this.isStopped) {
                    if (!_this.currentObservers) {
                        _this.currentObservers = Array.from(_this.observers);
                    }
                    try {
                        for (var _b = __values(_this.currentObservers), _c = _b.next(); !_c.done; _c = _b.next()) {
                            var observer = _c.value;
                            observer.next(value);
                        }
                    }
                    catch (e_1_1) { e_1 = { error: e_1_1 }; }
                    finally {
                        try {
                            if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                        }
                        finally { if (e_1) throw e_1.error; }
                    }
                }
            });
        };
        Subject.prototype.error = function (err) {
            var _this = this;
            errorContext(function () {
                _this._throwIfClosed();
                if (!_this.isStopped) {
                    _this.hasError = _this.isStopped = true;
                    _this.thrownError = err;
                    var observers = _this.observers;
                    while (observers.length) {
                        observers.shift().error(err);
                    }
                }
            });
        };
        Subject.prototype.complete = function () {
            var _this = this;
            errorContext(function () {
                _this._throwIfClosed();
                if (!_this.isStopped) {
                    _this.isStopped = true;
                    var observers = _this.observers;
                    while (observers.length) {
                        observers.shift().complete();
                    }
                }
            });
        };
        Subject.prototype.unsubscribe = function () {
            this.isStopped = this.closed = true;
            this.observers = this.currentObservers = null;
        };
        Object.defineProperty(Subject.prototype, "observed", {
            get: function () {
                var _a;
                return ((_a = this.observers) === null || _a === void 0 ? void 0 : _a.length) > 0;
            },
            enumerable: false,
            configurable: true
        });
        Subject.prototype._trySubscribe = function (subscriber) {
            this._throwIfClosed();
            return _super.prototype._trySubscribe.call(this, subscriber);
        };
        Subject.prototype._subscribe = function (subscriber) {
            this._throwIfClosed();
            this._checkFinalizedStatuses(subscriber);
            return this._innerSubscribe(subscriber);
        };
        Subject.prototype._innerSubscribe = function (subscriber) {
            var _this = this;
            var _a = this, hasError = _a.hasError, isStopped = _a.isStopped, observers = _a.observers;
            if (hasError || isStopped) {
                return EMPTY_SUBSCRIPTION;
            }
            this.currentObservers = null;
            observers.push(subscriber);
            return new Subscription(function () {
                _this.currentObservers = null;
                arrRemove(observers, subscriber);
            });
        };
        Subject.prototype._checkFinalizedStatuses = function (subscriber) {
            var _a = this, hasError = _a.hasError, thrownError = _a.thrownError, isStopped = _a.isStopped;
            if (hasError) {
                subscriber.error(thrownError);
            }
            else if (isStopped) {
                subscriber.complete();
            }
        };
        Subject.prototype.asObservable = function () {
            var observable = new Observable();
            observable.source = this;
            return observable;
        };
        Subject.create = function (destination, source) {
            return new AnonymousSubject(destination, source);
        };
        return Subject;
    }(Observable));
    var AnonymousSubject = (function (_super) {
        __extends(AnonymousSubject, _super);
        function AnonymousSubject(destination, source) {
            var _this = _super.call(this) || this;
            _this.destination = destination;
            _this.source = source;
            return _this;
        }
        AnonymousSubject.prototype.next = function (value) {
            var _a, _b;
            (_b = (_a = this.destination) === null || _a === void 0 ? void 0 : _a.next) === null || _b === void 0 ? void 0 : _b.call(_a, value);
        };
        AnonymousSubject.prototype.error = function (err) {
            var _a, _b;
            (_b = (_a = this.destination) === null || _a === void 0 ? void 0 : _a.error) === null || _b === void 0 ? void 0 : _b.call(_a, err);
        };
        AnonymousSubject.prototype.complete = function () {
            var _a, _b;
            (_b = (_a = this.destination) === null || _a === void 0 ? void 0 : _a.complete) === null || _b === void 0 ? void 0 : _b.call(_a);
        };
        AnonymousSubject.prototype._subscribe = function (subscriber) {
            var _a, _b;
            return (_b = (_a = this.source) === null || _a === void 0 ? void 0 : _a.subscribe(subscriber)) !== null && _b !== void 0 ? _b : EMPTY_SUBSCRIPTION;
        };
        return AnonymousSubject;
    }(Subject));

    class HistoryManager {
        constructor() {
            this.states = [];
            this.pointer = -1;
        }
        pushState(state) {
            if (this.pointer !== this.states.length - 1) {
                this.states.splice(this.pointer + 1);
            }
            this.states.push(state);
            this.pointer++;
        }
        undo() {
            if (this.pointer < 0)
                return;
            this.states[this.pointer].undo();
            this.pointer--;
        }
        redo() {
            if (this.pointer + 1 === this.states.length)
                return;
            this.states[this.pointer + 1].redo();
            this.pointer++;
        }
    }

    const PointUtils = {
        createPoint(x, y, timeValue, brushSize) {
            return [x, y, timeValue, brushSize];
        },
        parsePointX(point) {
            return point[0];
        },
        parsePointY(point) {
            return point[1];
        },
        parsePointTime(point) {
            return point[2];
        },
        parseBrushSize(point) {
            return point[3];
        },
        flatten(point) {
            return {
                x: PointUtils.parsePointX(point),
                y: PointUtils.parsePointY(point),
                time: PointUtils.parsePointTime(point),
                brushSize: PointUtils.parseBrushSize(point),
            };
        },
        restore(data) {
            return PointUtils.createPoint(data.x, data.y, data.time, data.brushSize);
        }
    };

    class PaintingKeyframe {
        constructor(point) {
            this.point = point;
            this.speed = 500;
        }
        ;
        flatten() {
            return {
                point: PointUtils.flatten(this.point),
                speed: this.speed
            };
        }
        static restore(data) {
            const p = new PaintingKeyframe(PointUtils.restore(data.point));
            p.speed = data.speed;
            return p;
        }
        apply(path) {
            path.effectivePointsPerSeconds = this.speed;
        }
    }

    function HSVtoRGB(h, s, v) {
        var r, g, b, i, f, p, q, t;
        if (arguments.length === 1) {
            s = h.s, v = h.v, h = h.h;
        }
        i = Math.floor(h * 6);
        f = h * 6 - i;
        p = v * (1 - s);
        q = v * (1 - f * s);
        t = v * (1 - (1 - f) * s);
        switch (i % 6) {
            case 0:
                r = v, g = t, b = p;
                break;
            case 1:
                r = q, g = v, b = p;
                break;
            case 2:
                r = p, g = v, b = t;
                break;
            case 3:
                r = p, g = q, b = v;
                break;
            case 4:
                r = t, g = p, b = v;
                break;
            case 5:
                r = v, g = p, b = q;
                break;
        }
        return {
            r: Math.round(r * 255),
            g: Math.round(g * 255),
            b: Math.round(b * 255)
        };
    }
    function getPixelsOnLine(x1, y1, x0, y0, cb) {
        var dx = Math.abs(x1 - x0);
        var dy = Math.abs(y1 - y0);
        var sx = (x0 < x1) ? 1 : -1;
        var sy = (y0 < y1) ? 1 : -1;
        var err = dx - dy;
        while (true) {
            cb(x0, y0); // Do what you need to for this
            if (Math.abs(x0 - x1) < 0.0001 && Math.abs(y0 - y1) < 0.0001)
                break;
            var e2 = 2 * err;
            if (e2 > -dy) {
                err -= dy;
                x0 += sx;
            }
            if (e2 < dx) {
                err += dx;
                y0 += sy;
            }
        }
    }
    function saveData() {
        var a = document.createElement("a");
        document.body.appendChild(a);
        a.style.display = "none";
        return function (blob, fileName) {
            let url = window.URL.createObjectURL(blob);
            a.href = url;
            a.download = fileName;
            a.click();
            window.URL.revokeObjectURL(url);
        };
    }
    function readFile(cb) {
        const input = document.createElement("input");
        input.style.display = "none";
        input.type = "file";
        document.body.appendChild(input);
        input.click();
        input.addEventListener('change', () => {
            var fr = new FileReader();
            fr.onload = function () {
                document.body.removeChild(input);
                cb(JSON.parse(fr.result.toString()), input.files[0].name);
            };
            fr.readAsText(input.files[0]);
        });
    }
    function readFileBin(cb) {
        const input = document.createElement("input");
        input.style.display = "none";
        input.type = "file";
        document.body.appendChild(input);
        input.click();
        input.addEventListener('change', () => {
            cb(input.files[0]);
        });
    }

    let ID_COUNTER = 0;
    class Path {
        constructor() {
            this.id = ID_COUNTER++;
            this.name = "New Path";
            this.points = [];
            this.transaction = [];
            this.eraseTransaction = [];
            this.keyframes = [];
            this.pointsPerSecond = 250;
            this.effectivePointsPerSeconds = this.pointsPerSecond;
            this.delay = 0;
            this.lastPoint = null;
            this.newPoint$ = new Subject();
            this.newKeyframe$ = new Subject();
            this.changed$ = new Subject(); // the whole thing needs to be redrawn
        }
        get clean() {
            return this.points.length == 0 && this.keyframes.length == 0;
        }
        findDist(x1, x2, y1, y2) {
            return Math.sqrt(Math.abs(x2 - x1) ** 2 + Math.abs(y2 - y1) ** 2);
        }
        applyKeyframesForPoint(point) {
            this.effectivePointsPerSeconds = this.pointsPerSecond;
            this.keyframes.filter(k => PointUtils.parsePointTime(k.point) <= point).map(k => k.apply(this));
        }
        flatten() {
            return {
                points: this.points.map(p => PointUtils.flatten(p)),
                keyframes: this.keyframes.map(k => k.flatten()),
                pointsPerSecond: this.pointsPerSecond,
                name: this.name,
                id: this.id,
                delay: this.delay
            };
        }
        static restore(data) {
            const path = new Path();
            path.points = data.points.map(p => PointUtils.restore(p));
            path.keyframes = data.keyframes.map(k => PaintingKeyframe.restore(k));
            path.pointsPerSecond = data.pointsPerSecond;
            path.name = data.name;
            path.id = data.id;
            path.delay = data.delay;
            return path;
        }
        findClosestPoint(pointX, pointY) {
            if (this.points.length == 0)
                return null;
            let prev = this.points[0];
            let prevX;
            let prevY;
            let prevDist;
            const updatePrevValues = () => {
                prevX = PointUtils.parsePointX(prev);
                prevY = PointUtils.parsePointY(prev);
                prevDist = this.findDist(prevX, pointX, prevY, pointY);
            };
            updatePrevValues();
            for (const point of this.points) {
                const X = PointUtils.parsePointX(point);
                const Y = PointUtils.parsePointY(point);
                const dist = this.findDist(X, pointX, Y, pointY);
                if (dist < prevDist) {
                    prev = point;
                    updatePrevValues();
                }
            }
            return prev;
        }
        addPoint(x, y, brushSize) {
            // something is pressed
            this.lastPoint = this.findClosestPoint(x, y);
            if (this.lastPoint != null) {
                const lpX = PointUtils.parsePointX(this.lastPoint);
                const lpY = PointUtils.parsePointY(this.lastPoint);
                if (lpX == x && lpY == y) {
                    return;
                }
            }
            const point = PointUtils.createPoint(x, y, this.lastPoint != null ? PointUtils.parsePointTime(this.lastPoint) + 1 : 0, brushSize);
            this.points.push(point);
            this.transaction.push(point);
            this.lastPoint = point;
            this.newPoint$.next(point);
        }
        eraseRadius(x, y, brushSize) {
            this.points = this.points.filter(p => {
                const res = this.findDist(x, PointUtils.parsePointX(p), y, PointUtils.parsePointY(p)) > brushSize;
                if (!res)
                    this.eraseTransaction.push(p);
                return res;
            });
            this.changed$.next();
        }
        addKeyframe(x, y, brushSize) {
            var _a;
            const keyframe = new PaintingKeyframe(PointUtils.createPoint(x, y, (_a = PointUtils.parsePointTime(this.findClosestPoint(x, y)) + 1) !== null && _a !== void 0 ? _a : 0, brushSize));
            this.keyframes.push(keyframe);
            this.newKeyframe$.next(keyframe);
        }
        finishTransaction() {
            const state = this.transaction;
            const eraseState = this.eraseTransaction;
            this.transaction = [];
            this.eraseTransaction = [];
            return {
                name: "Add stroke",
                undo: () => {
                    this.points = this.points.filter(p => !state.includes(p)).concat(eraseState);
                    this.changed$.next();
                },
                redo: () => {
                    this.points = this.points.concat(state).filter(p => !eraseState.includes(p));
                    this.changed$.next();
                }
            };
        }
        strokeDone() {
            this.lastPoint = null;
        }
    }

    class Painting {
        constructor() {
            this.paths = [new Path()];
        }
        addPath() {
            const path = new Path();
            this.paths.push(path);
            return path;
        }
        flatten() {
            return {
                paths: this.paths.map(p => p.flatten()),
            };
        }
        get clean() {
            return this.paths.every(p => p.clean);
        }
        static restore(data) {
            const painting = new Painting();
            painting.paths = data.paths.map(p => Path.restore(p));
            return painting;
        }
    }

    class PaintingViewPrinter {
        constructor(canvas) {
            this.canvas = canvas;
            this.totalPoints = 0;
            this.pathProgress = new Map();
            this.pathPoints = new Map();
            this.secSinceStart = 0;
            this.ctx = canvas.getContext('2d');
        }
        allDrawn() {
            for (const points of this.pathPoints.values()) {
                if (points.length > 0)
                    return false;
            }
            return true;
        }
        drawNextFrame(secSinceLastFrame) {
            this.secSinceStart += secSinceLastFrame;
            const points = this.pointsForPaths(secSinceLastFrame);
            if (this.allDrawn())
                return false;
            // creates a path, calls drawPoint() to draw any number of points into that path, then clips into it
            // then draws the background with clip and restores it
            for (const path of points) {
                this.ctx.save();
                this.ctx.beginPath();
                for (const point of path)
                    this.drawPoint(point);
                this.ctx.clip();
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                this.ctx.drawImage(this.image, 0, 0);
                this.ctx.restore();
            }
            return true;
        }
        pointsForPaths(secSinceLastFrame) {
            return this.painting.paths.map(path => {
                var _a, _b;
                if (this.secSinceStart < path.delay / 1000)
                    return null;
                let prog = (_a = this.pathProgress.get(path)) !== null && _a !== void 0 ? _a : 0;
                prog += secSinceLastFrame * path.effectivePointsPerSeconds;
                this.pathProgress.set(path, prog);
                path.applyKeyframesForPoint(prog);
                let points = (_b = this.pathPoints.get(path)) !== null && _b !== void 0 ? _b : path.points;
                let wanted = [];
                points = points.filter(p => {
                    const use = PointUtils.parsePointTime(p) <= prog;
                    if (use)
                        wanted.push(p);
                    return !use;
                });
                this.pathPoints.set(path, points);
                return wanted;
            }).filter(p => p != null);
        }
        prepare() {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.totalPoints = this.painting.paths.reduce((prev, curr) => prev + curr.points.length, 0);
            this.pathProgress.clear();
            this.secSinceStart = 0;
            this.pathProgress.clear();
            for (const path of this.painting.paths) {
                this.pathPoints.set(path, path.points);
            }
        }
        drawPoint(point) {
            this.ctx.arc(PointUtils.parsePointX(point), PointUtils.parsePointY(point), PointUtils.parseBrushSize(point), 0, 2 * Math.PI);
        }
    }

    class PathCreatePrinter {
        constructor(canvas) {
            this.canvas = canvas;
            this.currentPathSubscriptions = [];
            this.ctx = canvas.getContext('2d');
        }
        set currentPath(value) {
            this._currentPath = value;
            this.currentPathSubscriptions.forEach(i => i.unsubscribe());
            this.redrawPath();
            if (value == null)
                return;
            this.currentPathSubscriptions.push(value.newPoint$.subscribe(p => this.drawPoint(p)));
            this.currentPathSubscriptions.push(value.changed$.subscribe(() => this.redrawPath()));
        }
        get currentPath() {
            return this._currentPath;
        }
        redrawPath() {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            if (this.currentPath == null)
                return;
            for (const p of this.currentPath.points)
                this.drawPoint(p);
        }
        drawPoint(point) {
            const pointTime = PointUtils.parsePointTime(point);
            const color = HSVtoRGB(pointTime / 1000, 1, 1);
            this.ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, 255)`;
            this.ctx.beginPath();
            this.ctx.arc(PointUtils.parsePointX(point), PointUtils.parsePointY(point), PointUtils.parseBrushSize(point), 0, 2 * Math.PI, false);
            this.ctx.fill();
        }
    }

    /* src/PointView.svelte generated by Svelte v3.46.4 */
    const file$1 = "src/PointView.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i];
    	return child_ctx;
    }

    // (22:0) {#if path != null}
    function create_if_block$1(ctx) {
    	let each_1_anchor;
    	let each_value = /*path*/ ctx[0].keyframes;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*PointUtils, path, changeSpeed*/ 3) {
    				each_value = /*path*/ ctx[0].keyframes;
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(22:0) {#if path != null}",
    		ctx
    	});

    	return block;
    }

    // (23:4) {#each path.keyframes as keyframe}
    function create_each_block$1(ctx) {
    	let span;
    	let mounted;
    	let dispose;

    	function click_handler() {
    		return /*click_handler*/ ctx[3](/*keyframe*/ ctx[4]);
    	}

    	const block = {
    		c: function create() {
    			span = element("span");
    			attr_dev(span, "class", "keyframe svelte-cpouo2");
    			set_style(span, "top", PointUtils.parsePointY(/*keyframe*/ ctx[4].point) - 5 + "px");
    			set_style(span, "left", PointUtils.parsePointX(/*keyframe*/ ctx[4].point) - 5 + "px");
    			add_location(span, file$1, 23, 8, 583);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);

    			if (!mounted) {
    				dispose = listen_dev(span, "click", click_handler, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*path*/ 1) {
    				set_style(span, "top", PointUtils.parsePointY(/*keyframe*/ ctx[4].point) - 5 + "px");
    			}

    			if (dirty & /*path*/ 1) {
    				set_style(span, "left", PointUtils.parsePointX(/*keyframe*/ ctx[4].point) - 5 + "px");
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(23:4) {#each path.keyframes as keyframe}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let if_block_anchor;
    	let if_block = /*path*/ ctx[0] != null && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*path*/ ctx[0] != null) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: noop$1,
    		o: noop$1,
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('PointView', slots, []);
    	let { path } = $$props;
    	let subs = [];

    	const changeSpeed = keyframe => {
    		keyframe.speed = parseInt(prompt("New speed", keyframe.speed.toString()));
    	};

    	const writable_props = ['path'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<PointView> was created with unknown prop '${key}'`);
    	});

    	const click_handler = keyframe => {
    		changeSpeed(keyframe);
    	};

    	$$self.$$set = $$props => {
    		if ('path' in $$props) $$invalidate(0, path = $$props.path);
    	};

    	$$self.$capture_state = () => ({ PointUtils, path, subs, changeSpeed });

    	$$self.$inject_state = $$props => {
    		if ('path' in $$props) $$invalidate(0, path = $$props.path);
    		if ('subs' in $$props) $$invalidate(2, subs = $$props.subs);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*subs, path*/ 5) {
    			{
    				subs.forEach(s => s.unsubscribe());
    				$$invalidate(2, subs = []);

    				if (path != null) {
    					subs.push(path.newKeyframe$.subscribe(k => {
    						($$invalidate(0, path), $$invalidate(2, subs));
    						changeSpeed(k);
    					}));

    					subs.push(path.changed$.subscribe(k => {
    						($$invalidate(0, path), $$invalidate(2, subs));
    					}));
    				}
    			}
    		}
    	};

    	return [path, changeSpeed, subs, click_handler];
    }

    class PointView extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { path: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "PointView",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*path*/ ctx[0] === undefined && !('path' in props)) {
    			console.warn("<PointView> was created without expected prop 'path'");
    		}
    	}

    	get path() {
    		throw new Error("<PointView>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set path(value) {
    		throw new Error("<PointView>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    // from https://stackoverflow.com/questions/58907270/record-at-constant-fps-with-canvascapturemediastream-even-on-slow-computers
    function waitForEvent(target, type) {
        return new Promise((res) => target.addEventListener(type, res, {
          once: true
        }));
      }
      function wait(ms) {
        return new Promise(res => setTimeout(res, ms));
      }

    class FrameByFrameCanvasRecorder {
        constructor(source_canvas, FPS = 30) {
        
          this.FPS = FPS;
          this.source = source_canvas;
          const canvas = this.canvas = source_canvas.cloneNode();
          const ctx = this.drawingContext = canvas.getContext('2d');
      
          // we need to draw something on our canvas
          ctx.drawImage(source_canvas, 0, 0);
          const stream = this.stream = canvas.captureStream(0);
          const track = this.track = stream.getVideoTracks()[0];
          // Firefox still uses a non-standard CanvasCaptureMediaStream
          // instead of CanvasCaptureMediaStreamTrack
          if (!track.requestFrame) {
            track.requestFrame = () => stream.requestFrame();
          }
          // prepare our MediaRecorder
          const rec = this.recorder = new MediaRecorder(stream);
          const chunks = this.chunks = [];
          rec.ondataavailable = (evt) => chunks.push(evt.data);
          rec.start();
          // we need to be in 'paused' state
          waitForEvent(rec, 'start')
            .then((evt) => rec.pause());
          // expose a Promise for when it's done
          this._init = waitForEvent(rec, 'pause');
      
        }
        async recordFrame() {
      
          await this._init; // we have to wait for the recorder to be paused
          const rec = this.recorder;
          const canvas = this.canvas;
          const source = this.source;
          const ctx = this.drawingContext;
          if (canvas.width !== source.width ||
            canvas.height !== source.height) {
            canvas.width = source.width;
            canvas.height = source.height;
          }
      
          // start our timer now so whatever happens between is not taken in account
          const timer = wait(1000 / this.FPS);
      
          // wake up the recorder
          rec.resume();
          await waitForEvent(rec, 'resume');
      
          // draw the current state of source on our internal canvas (triggers requestFrame in Chrome)
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(source, 0, 0);
          // force write the frame
          this.track.requestFrame();
      
          // wait until our frame-time elapsed
          await timer;
      
          // sleep recorder
          rec.pause();
          await waitForEvent(rec, 'pause');
      
        }
        async export () {
      
          this.recorder.stop();
          this.stream.getTracks().forEach((track) => track.stop());
          await waitForEvent(this.recorder, "stop");
          return new Blob(this.chunks, {type: "video/mp4"});
      
        }
      }

    /* src/App.svelte generated by Svelte v3.46.4 */
    const file = "src/App.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[47] = list[i];
    	return child_ctx;
    }

    // (135:4) {:else}
    function create_else_block(ctx) {
    	let button;
    	let span;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			span = element("span");
    			span.textContent = "stop";
    			attr_dev(span, "class", "material-icons");
    			add_location(span, file, 138, 8, 4039);
    			attr_dev(button, "class", "svelte-u61lso");
    			add_location(button, file, 135, 5, 3928);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, span);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler_1*/ ctx[22], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop$1,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(135:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (116:4) {#if animationFrame == -1}
    function create_if_block_1(ctx) {
    	let button;
    	let span;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			span = element("span");
    			span.textContent = "play_arrow";
    			attr_dev(span, "class", "material-icons");
    			add_location(span, file, 133, 8, 3855);
    			attr_dev(button, "class", "svelte-u61lso");
    			add_location(button, file, 116, 5, 3391);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, span);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler*/ ctx[21], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop$1,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(116:4) {#if animationFrame == -1}",
    		ctx
    	});

    	return block;
    }

    // (200:5) {#each painting.paths as path}
    function create_each_block(ctx) {
    	let option;
    	let t0_value = /*path*/ ctx[47].name + "";
    	let t0;
    	let t1;
    	let option_value_value;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t0 = text(t0_value);
    			t1 = space();
    			option.__value = option_value_value = /*path*/ ctx[47].id;
    			option.value = option.__value;
    			add_location(option, file, 200, 6, 6333);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t0);
    			append_dev(option, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*painting*/ 1 && t0_value !== (t0_value = /*path*/ ctx[47].name + "")) set_data_dev(t0, t0_value);

    			if (dirty[0] & /*painting*/ 1 && option_value_value !== (option_value_value = /*path*/ ctx[47].id)) {
    				prop_dev(option, "__value", option_value_value);
    				option.value = option.__value;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(200:5) {#each painting.paths as path}",
    		ctx
    	});

    	return block;
    }

    // (209:3) {#if currentPath != null}
    function create_if_block(ctx) {
    	let span0;
    	let t1;
    	let input0;
    	let t2;
    	let span1;
    	let t4;
    	let input1;
    	let t5;
    	let span2;
    	let t7;
    	let input2;
    	let br;
    	let t8;
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			span0 = element("span");
    			span0.textContent = "Path name";
    			t1 = space();
    			input0 = element("input");
    			t2 = space();
    			span1 = element("span");
    			span1.textContent = "Speed";
    			t4 = space();
    			input1 = element("input");
    			t5 = space();
    			span2 = element("span");
    			span2.textContent = "Start delay (ms)";
    			t7 = space();
    			input2 = element("input");
    			br = element("br");
    			t8 = space();
    			button = element("button");
    			button.textContent = "Delete path";
    			attr_dev(span0, "class", "miniheader svelte-u61lso");
    			add_location(span0, file, 209, 4, 6539);
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "class", "svelte-u61lso");
    			add_location(input0, file, 210, 4, 6585);
    			attr_dev(span1, "class", "miniheader svelte-u61lso");
    			add_location(span1, file, 211, 4, 6679);
    			attr_dev(input1, "type", "range");
    			attr_dev(input1, "min", "1");
    			attr_dev(input1, "max", "1500");
    			attr_dev(input1, "class", "svelte-u61lso");
    			add_location(input1, file, 212, 4, 6721);
    			attr_dev(span2, "class", "miniheader svelte-u61lso");
    			add_location(span2, file, 213, 4, 6808);
    			attr_dev(input2, "type", "number");
    			attr_dev(input2, "class", "svelte-u61lso");
    			add_location(input2, file, 214, 4, 6861);
    			add_location(br, file, 214, 58, 6915);
    			set_style(button, "background-color", "#e53e3e");
    			set_style(button, "margin-top", "15px");
    			attr_dev(button, "class", "svelte-u61lso");
    			add_location(button, file, 215, 4, 6924);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, input0, anchor);
    			set_input_value(input0, /*currentPath*/ ctx[2].name);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, span1, anchor);
    			insert_dev(target, t4, anchor);
    			insert_dev(target, input1, anchor);
    			set_input_value(input1, /*currentPath*/ ctx[2].pointsPerSecond);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, span2, anchor);
    			insert_dev(target, t7, anchor);
    			insert_dev(target, input2, anchor);
    			set_input_value(input2, /*currentPath*/ ctx[2].delay);
    			insert_dev(target, br, anchor);
    			insert_dev(target, t8, anchor);
    			insert_dev(target, button, anchor);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler_1*/ ctx[31]),
    					listen_dev(input0, "change", /*change_handler_1*/ ctx[32], false, false, false),
    					listen_dev(input1, "change", /*input1_change_input_handler*/ ctx[33]),
    					listen_dev(input1, "input", /*input1_change_input_handler*/ ctx[33]),
    					listen_dev(input2, "input", /*input2_input_handler*/ ctx[34]),
    					listen_dev(button, "click", /*click_handler_9*/ ctx[35], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*currentPath, painting*/ 5 && input0.value !== /*currentPath*/ ctx[2].name) {
    				set_input_value(input0, /*currentPath*/ ctx[2].name);
    			}

    			if (dirty[0] & /*currentPath, painting*/ 5) {
    				set_input_value(input1, /*currentPath*/ ctx[2].pointsPerSecond);
    			}

    			if (dirty[0] & /*currentPath, painting*/ 5 && to_number(input2.value) !== /*currentPath*/ ctx[2].delay) {
    				set_input_value(input2, /*currentPath*/ ctx[2].delay);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(input0);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(span1);
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(input1);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(span2);
    			if (detaching) detach_dev(t7);
    			if (detaching) detach_dev(input2);
    			if (detaching) detach_dev(br);
    			if (detaching) detach_dev(t8);
    			if (detaching) detach_dev(button);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(209:3) {#if currentPath != null}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let main;
    	let div4;
    	let div2;
    	let input0;
    	let t0;
    	let div0;
    	let t1;
    	let button0;
    	let span0;
    	let t3;
    	let button1;
    	let span1;
    	let t5;
    	let button2;
    	let span2;
    	let t7;
    	let button3;
    	let span3;
    	let t9;
    	let button4;
    	let span4;
    	let button4_class_value;
    	let t11;
    	let button5;
    	let span5;
    	let button5_class_value;
    	let t13;
    	let button6;
    	let span6;
    	let t15;
    	let div1;
    	let select;
    	let option0;
    	let option1;
    	let select_value_value;
    	let t17;
    	let t18;
    	let div3;
    	let span7;
    	let t20;
    	let input1;
    	let t21;
    	let div7;
    	let div5;
    	let img;
    	let img_src_value;
    	let t22;
    	let canvas0;
    	let t23;
    	let pointview;
    	let t24;
    	let div6;
    	let canvas1;
    	let current;
    	let mounted;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (/*animationFrame*/ ctx[10] == -1) return create_if_block_1;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block0 = current_block_type(ctx);
    	let each_value = /*painting*/ ctx[0].paths;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	let if_block1 = /*currentPath*/ ctx[2] != null && create_if_block(ctx);

    	pointview = new PointView({
    			props: { path: /*currentPath*/ ctx[2] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			main = element("main");
    			div4 = element("div");
    			div2 = element("div");
    			input0 = element("input");
    			t0 = space();
    			div0 = element("div");
    			if_block0.c();
    			t1 = space();
    			button0 = element("button");
    			span0 = element("span");
    			span0.textContent = "image";
    			t3 = space();
    			button1 = element("button");
    			span1 = element("span");
    			span1.textContent = "download";
    			t5 = space();
    			button2 = element("button");
    			span2 = element("span");
    			span2.textContent = "upload";
    			t7 = space();
    			button3 = element("button");
    			span3 = element("span");
    			span3.textContent = "layers_clear";
    			t9 = space();
    			button4 = element("button");
    			span4 = element("span");
    			span4.textContent = "brush";
    			t11 = space();
    			button5 = element("button");
    			span5 = element("span");
    			span5.textContent = "clear";
    			t13 = space();
    			button6 = element("button");
    			span6 = element("span");
    			span6.textContent = "movie";
    			t15 = space();
    			div1 = element("div");
    			select = element("select");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			option0 = element("option");
    			option1 = element("option");
    			option1.textContent = "Add Path";
    			t17 = space();
    			if (if_block1) if_block1.c();
    			t18 = space();
    			div3 = element("div");
    			span7 = element("span");
    			span7.textContent = "Brush size";
    			t20 = space();
    			input1 = element("input");
    			t21 = space();
    			div7 = element("div");
    			div5 = element("div");
    			img = element("img");
    			t22 = space();
    			canvas0 = element("canvas");
    			t23 = space();
    			create_component(pointview.$$.fragment);
    			t24 = space();
    			div6 = element("div");
    			canvas1 = element("canvas");
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "placeholder", "Project Name");
    			attr_dev(input0, "class", "svelte-u61lso");
    			add_location(input0, file, 113, 3, 3264);
    			attr_dev(span0, "class", "material-icons");
    			add_location(span0, file, 148, 26, 4351);
    			attr_dev(button0, "title", "Open image");
    			attr_dev(button0, "class", "svelte-u61lso");
    			add_location(button0, file, 140, 4, 4103);
    			attr_dev(span1, "class", "material-icons");
    			add_location(span1, file, 153, 7, 4580);
    			attr_dev(button1, "class", "svelte-u61lso");
    			add_location(button1, file, 149, 4, 4406);
    			attr_dev(span2, "class", "material-icons");
    			add_location(span2, file, 163, 7, 4877);
    			attr_dev(button2, "class", "svelte-u61lso");
    			add_location(button2, file, 154, 4, 4638);
    			attr_dev(span3, "class", "material-icons");
    			add_location(span3, file, 169, 32, 5108);
    			attr_dev(button3, "title", "Clear all layers");
    			attr_dev(button3, "class", "svelte-u61lso");
    			add_location(button3, file, 164, 4, 4933);
    			attr_dev(span4, "class", "material-icons");
    			add_location(span4, file, 172, 42, 5260);
    			attr_dev(button4, "class", button4_class_value = "" + (null_to_empty(!/*erasing*/ ctx[13] ? "selected" : "") + " svelte-u61lso"));
    			add_location(button4, file, 170, 4, 5170);
    			attr_dev(span5, "class", "material-icons");
    			add_location(span5, file, 175, 55, 5417);
    			attr_dev(button5, "title", "Erase");
    			attr_dev(button5, "class", button5_class_value = "" + (null_to_empty(/*erasing*/ ctx[13] ? "selected" : "") + " svelte-u61lso"));
    			add_location(button5, file, 173, 4, 5315);
    			attr_dev(span6, "class", "material-icons");
    			add_location(span6, file, 185, 22, 5833);
    			attr_dev(button6, "title", "Render");
    			attr_dev(button6, "class", "svelte-u61lso");
    			add_location(button6, file, 176, 4, 5472);
    			attr_dev(div0, "class", "topbar svelte-u61lso");
    			add_location(div0, file, 114, 3, 3334);
    			option0.__value = -1;
    			option0.value = option0.__value;
    			add_location(option0, file, 204, 5, 6411);
    			option1.__value = -2;
    			option1.value = option1.__value;
    			add_location(option1, file, 205, 5, 6445);
    			attr_dev(select, "class", "svelte-u61lso");
    			add_location(select, file, 188, 4, 5932);
    			set_style(div1, "text-align", "right");
    			add_location(div1, file, 187, 3, 5897);
    			attr_dev(div2, "class", "sidebartop svelte-u61lso");
    			add_location(div2, file, 112, 2, 3236);
    			attr_dev(span7, "class", "miniheader svelte-u61lso");
    			add_location(span7, file, 223, 3, 7192);
    			attr_dev(input1, "type", "range");
    			attr_dev(input1, "min", "1");
    			attr_dev(input1, "max", "20");
    			attr_dev(input1, "class", "svelte-u61lso");
    			add_location(input1, file, 224, 3, 7238);
    			attr_dev(div3, "class", "footer");
    			add_location(div3, file, 222, 2, 7168);
    			attr_dev(div4, "class", "sidebar svelte-u61lso");
    			add_location(div4, file, 111, 1, 3212);
    			if (!src_url_equal(img.src, img_src_value = /*currentFileUrl*/ ctx[4])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "class", "svelte-u61lso");
    			add_location(img, file, 231, 3, 7731);
    			attr_dev(canvas0, "width", /*imageWidth*/ ctx[8]);
    			attr_dev(canvas0, "height", /*imageHeight*/ ctx[9]);
    			attr_dev(canvas0, "class", "svelte-u61lso");
    			add_location(canvas0, file, 235, 3, 7866);
    			attr_dev(div5, "class", "overlay image svelte-u61lso");
    			set_style(div5, "cursor", `url('data:image/svg+xml;utf8,<svg stroke="%23000000" fill="transparent" height="${/*strokeWidth*/ ctx[12] * 2}" viewBox="0 0 ${/*strokeWidth*/ ctx[12] * 2} ${/*strokeWidth*/ ctx[12] * 2}" width="${/*strokeWidth*/ ctx[12] * 2}" xmlns="http://www.w3.org/2000/svg"><circle cx="${/*strokeWidth*/ ctx[12]}" cy="${/*strokeWidth*/ ctx[12]}" r="${/*strokeWidth*/ ctx[12]}"/></svg>') ${/*strokeWidth*/ ctx[12]} ${/*strokeWidth*/ ctx[12]}, auto`);
    			add_location(div5, file, 228, 2, 7353);
    			attr_dev(canvas1, "width", /*imageWidth*/ ctx[8]);
    			attr_dev(canvas1, "height", /*imageHeight*/ ctx[9]);
    			attr_dev(canvas1, "class", "svelte-u61lso");
    			add_location(canvas1, file, 242, 3, 8120);
    			attr_dev(div6, "class", "image svelte-u61lso");
    			add_location(div6, file, 241, 2, 8097);
    			attr_dev(div7, "class", "imagesContainer svelte-u61lso");
    			add_location(div7, file, 227, 1, 7321);
    			attr_dev(main, "class", "svelte-u61lso");
    			add_location(main, file, 110, 0, 3204);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div4);
    			append_dev(div4, div2);
    			append_dev(div2, input0);
    			set_input_value(input0, /*name*/ ctx[14]);
    			append_dev(div2, t0);
    			append_dev(div2, div0);
    			if_block0.m(div0, null);
    			append_dev(div0, t1);
    			append_dev(div0, button0);
    			append_dev(button0, span0);
    			append_dev(div0, t3);
    			append_dev(div0, button1);
    			append_dev(button1, span1);
    			append_dev(div0, t5);
    			append_dev(div0, button2);
    			append_dev(button2, span2);
    			append_dev(div0, t7);
    			append_dev(div0, button3);
    			append_dev(button3, span3);
    			append_dev(div0, t9);
    			append_dev(div0, button4);
    			append_dev(button4, span4);
    			append_dev(div0, t11);
    			append_dev(div0, button5);
    			append_dev(button5, span5);
    			append_dev(div0, t13);
    			append_dev(div0, button6);
    			append_dev(button6, span6);
    			append_dev(div2, t15);
    			append_dev(div2, div1);
    			append_dev(div1, select);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(select, null);
    			}

    			append_dev(select, option0);
    			append_dev(select, option1);
    			select_option(select, /*currentPath*/ ctx[2]?.id ?? -1);
    			append_dev(div2, t17);
    			if (if_block1) if_block1.m(div2, null);
    			append_dev(div4, t18);
    			append_dev(div4, div3);
    			append_dev(div3, span7);
    			append_dev(div3, t20);
    			append_dev(div3, input1);
    			set_input_value(input1, /*strokeWidth*/ ctx[12]);
    			append_dev(main, t21);
    			append_dev(main, div7);
    			append_dev(div7, div5);
    			append_dev(div5, img);
    			/*img_binding*/ ctx[37](img);
    			append_dev(div5, t22);
    			append_dev(div5, canvas0);
    			/*canvas0_binding*/ ctx[39](canvas0);
    			append_dev(div5, t23);
    			mount_component(pointview, div5, null);
    			append_dev(div7, t24);
    			append_dev(div7, div6);
    			append_dev(div6, canvas1);
    			/*canvas1_binding*/ ctx[41](canvas1);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[20]),
    					listen_dev(button0, "click", /*click_handler_2*/ ctx[23], false, false, false),
    					listen_dev(button1, "click", /*click_handler_3*/ ctx[24], false, false, false),
    					listen_dev(button2, "click", /*click_handler_4*/ ctx[25], false, false, false),
    					listen_dev(button3, "click", /*click_handler_5*/ ctx[26], false, false, false),
    					listen_dev(button4, "click", /*click_handler_6*/ ctx[27], false, false, false),
    					listen_dev(button5, "click", /*click_handler_7*/ ctx[28], false, false, false),
    					listen_dev(button6, "click", /*click_handler_8*/ ctx[29], false, false, false),
    					listen_dev(select, "change", /*change_handler*/ ctx[30], false, false, false),
    					listen_dev(input1, "change", /*input1_change_input_handler_1*/ ctx[36]),
    					listen_dev(input1, "input", /*input1_change_input_handler_1*/ ctx[36]),
    					listen_dev(img, "load", /*load_handler*/ ctx[38], false, false, false),
    					listen_dev(canvas0, "mousemove", /*mouseMove*/ ctx[18], false, false, false),
    					listen_dev(canvas0, "wheel", /*wheel_handler*/ ctx[40], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*name*/ 16384 && input0.value !== /*name*/ ctx[14]) {
    				set_input_value(input0, /*name*/ ctx[14]);
    			}

    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block0) {
    				if_block0.p(ctx, dirty);
    			} else {
    				if_block0.d(1);
    				if_block0 = current_block_type(ctx);

    				if (if_block0) {
    					if_block0.c();
    					if_block0.m(div0, t1);
    				}
    			}

    			if (!current || dirty[0] & /*erasing*/ 8192 && button4_class_value !== (button4_class_value = "" + (null_to_empty(!/*erasing*/ ctx[13] ? "selected" : "") + " svelte-u61lso"))) {
    				attr_dev(button4, "class", button4_class_value);
    			}

    			if (!current || dirty[0] & /*erasing*/ 8192 && button5_class_value !== (button5_class_value = "" + (null_to_empty(/*erasing*/ ctx[13] ? "selected" : "") + " svelte-u61lso"))) {
    				attr_dev(button5, "class", button5_class_value);
    			}

    			if (dirty[0] & /*painting*/ 1) {
    				each_value = /*painting*/ ctx[0].paths;
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(select, option0);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (!current || dirty[0] & /*currentPath, painting*/ 5 && select_value_value !== (select_value_value = /*currentPath*/ ctx[2]?.id ?? -1)) {
    				select_option(select, /*currentPath*/ ctx[2]?.id ?? -1);
    			}

    			if (/*currentPath*/ ctx[2] != null) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block(ctx);
    					if_block1.c();
    					if_block1.m(div2, null);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (dirty[0] & /*strokeWidth*/ 4096) {
    				set_input_value(input1, /*strokeWidth*/ ctx[12]);
    			}

    			if (!current || dirty[0] & /*currentFileUrl*/ 16 && !src_url_equal(img.src, img_src_value = /*currentFileUrl*/ ctx[4])) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (!current || dirty[0] & /*imageWidth*/ 256) {
    				attr_dev(canvas0, "width", /*imageWidth*/ ctx[8]);
    			}

    			if (!current || dirty[0] & /*imageHeight*/ 512) {
    				attr_dev(canvas0, "height", /*imageHeight*/ ctx[9]);
    			}

    			const pointview_changes = {};
    			if (dirty[0] & /*currentPath*/ 4) pointview_changes.path = /*currentPath*/ ctx[2];
    			pointview.$set(pointview_changes);

    			if (!current || dirty[0] & /*strokeWidth*/ 4096) {
    				set_style(div5, "cursor", `url('data:image/svg+xml;utf8,<svg stroke="%23000000" fill="transparent" height="${/*strokeWidth*/ ctx[12] * 2}" viewBox="0 0 ${/*strokeWidth*/ ctx[12] * 2} ${/*strokeWidth*/ ctx[12] * 2}" width="${/*strokeWidth*/ ctx[12] * 2}" xmlns="http://www.w3.org/2000/svg"><circle cx="${/*strokeWidth*/ ctx[12]}" cy="${/*strokeWidth*/ ctx[12]}" r="${/*strokeWidth*/ ctx[12]}"/></svg>') ${/*strokeWidth*/ ctx[12]} ${/*strokeWidth*/ ctx[12]}, auto`);
    			}

    			if (!current || dirty[0] & /*imageWidth*/ 256) {
    				attr_dev(canvas1, "width", /*imageWidth*/ ctx[8]);
    			}

    			if (!current || dirty[0] & /*imageHeight*/ 512) {
    				attr_dev(canvas1, "height", /*imageHeight*/ ctx[9]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(pointview.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(pointview.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			if_block0.d();
    			destroy_each(each_blocks, detaching);
    			if (if_block1) if_block1.d();
    			/*img_binding*/ ctx[37](null);
    			/*canvas0_binding*/ ctx[39](null);
    			destroy_component(pointview);
    			/*canvas1_binding*/ ctx[41](null);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let canvas;
    	let previewCanvas;
    	let image;
    	let lastX = null;
    	let lastY = null;
    	let imageWidth = 0;
    	let imageHeight = 0;
    	let painting = new Painting();
    	let printer;
    	let previewPrinter;
    	let historyManager = new HistoryManager();
    	let currentPath;
    	let currentFile;
    	let currentFileUrl;

    	const chooseFirstPath = () => {
    		if (painting.paths.length > 0) {
    			$$invalidate(2, currentPath = painting.paths[0]);
    		}
    	};

    	chooseFirstPath();
    	let animationFrame = -1;
    	let lastFrame = -1;
    	let strokeWidth = 10;
    	let erasing = false;
    	let name = "";

    	const downloadName = () => {
    		return name != "" ? name : "Animation";
    	};

    	let saveFile = saveData();

    	onMount(async () => {
    		$$invalidate(19, printer = new PathCreatePrinter(canvas));
    		$$invalidate(1, previewPrinter = new PaintingViewPrinter(previewCanvas));
    		$$invalidate(1, previewPrinter.image = image, previewPrinter);
    	});

    	let mouseX = 0;
    	let mouseY = 0;

    	const mouseMove = e => {
    		if (currentPath == null) {
    			return;
    		}

    		let rect = canvas.getBoundingClientRect();
    		mouseX = e.clientX - rect.left;
    		mouseY = e.clientY - rect.top;

    		if (e.buttons != 0) {
    			if (lastX != null) {
    				getPixelsOnLine(lastX, lastY, mouseX, mouseY, (x1, y1) => erasing
    				? currentPath.eraseRadius(x1, y1, strokeWidth)
    				: currentPath.addPoint(x1, y1, strokeWidth));
    			}

    			lastX = mouseX;
    			lastY = mouseY;
    		} else {
    			if (lastX != null) {
    				historyManager.pushState(currentPath.finishTransaction());
    			}

    			currentPath.strokeDone();
    			lastX = null;
    		}
    	};

    	document.onkeydown = e => {
    		if (e.target !== document.body) return; // don't capture when in text fields

    		if (e.ctrlKey) {
    			switch (e.key) {
    				case "z":
    					historyManager.undo();
    					e.preventDefault();
    					break;
    				case "Z":
    				case "y":
    					historyManager.redo();
    					e.preventDefault();
    					break;
    				case "k":
    					if (currentPath == null) return;
    					currentPath.addKeyframe(mouseX, mouseY, strokeWidth);
    					e.preventDefault();
    					break;
    				case "p":
    					$$invalidate(2, currentPath = painting.addPath());
    					$$invalidate(0, painting);
    					e.preventDefault();
    					break;
    			}
    		}
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function input0_input_handler() {
    		name = this.value;
    		$$invalidate(14, name);
    	}

    	const click_handler = () => {
    		previewPrinter.prepare();
    		$$invalidate(11, lastFrame = -1);

    		const nextFrame = () => $$invalidate(10, animationFrame = window.requestAnimationFrame(t => {
    			if (lastFrame != -1) {
    				if (previewPrinter.drawNextFrame((t - lastFrame) / 1000)) {
    					nextFrame();
    				} else {
    					$$invalidate(10, animationFrame = -1);
    				}
    			} else {
    				$$invalidate(11, lastFrame = t);
    				nextFrame();
    			}

    			$$invalidate(11, lastFrame = t);
    		}));

    		nextFrame();
    	};

    	const click_handler_1 = () => {
    		window.cancelAnimationFrame(animationFrame);
    		$$invalidate(10, animationFrame = -1);
    	};

    	const click_handler_2 = () => {
    		readFileBin(f => {
    			if (!painting.clean && confirm("Are you sure you have saved?")) {
    				$$invalidate(0, painting = new Painting());
    				chooseFirstPath();
    			}

    			$$invalidate(3, currentFile = f);
    		});
    	};

    	const click_handler_3 = () => {
    		var json = JSON.stringify(painting.flatten()),
    			blob = new Blob([json], { type: "octet/stream" });

    		saveFile(blob, downloadName());
    	};

    	const click_handler_4 = () => {
    		if (!painting.clean && !confirm("Are you sure you have saved?")) {
    			return;
    		}

    		readFile((d, n) => {
    			$$invalidate(0, painting = Painting.restore(d));
    			$$invalidate(14, name = n);
    			chooseFirstPath();
    		});
    	};

    	const click_handler_5 = () => {
    		if (confirm("Are you sure you have saved?")) {
    			$$invalidate(0, painting = new Painting());
    			chooseFirstPath();
    		}
    	};

    	const click_handler_6 = () => {
    		$$invalidate(13, erasing = false);
    	};

    	const click_handler_7 = () => {
    		$$invalidate(13, erasing = true);
    	};

    	const click_handler_8 = async () => {
    		const fps = 60;
    		const recorder = new FrameByFrameCanvasRecorder(previewCanvas, fps);
    		previewPrinter.prepare();

    		while (previewPrinter.drawNextFrame(1 / fps)) {
    			await recorder.recordFrame();
    		}

    		const blob = await recorder.export();
    		saveFile(blob, `${downloadName()}.webm`);
    	};

    	const change_handler = e => {
    		const value = e.currentTarget.value;

    		if (value == "-1") {
    			$$invalidate(2, currentPath = null);
    		} else if (value == "-2") {
    			$$invalidate(2, currentPath = painting.addPath());
    		} else {
    			$$invalidate(2, currentPath = painting.paths.find(p => p.id == parseInt(value)));
    		}

    		$$invalidate(0, painting); // refresh
    	};

    	function input0_input_handler_1() {
    		currentPath.name = this.value;
    		$$invalidate(2, currentPath);
    		$$invalidate(0, painting);
    	}

    	const change_handler_1 = () => $$invalidate(0, painting);

    	function input1_change_input_handler() {
    		currentPath.pointsPerSecond = to_number(this.value);
    		$$invalidate(2, currentPath);
    		$$invalidate(0, painting);
    	}

    	function input2_input_handler() {
    		currentPath.delay = to_number(this.value);
    		$$invalidate(2, currentPath);
    		$$invalidate(0, painting);
    	}

    	const click_handler_9 = () => {
    		painting.paths.splice(painting.paths.indexOf(currentPath), 1);
    		$$invalidate(2, currentPath = null);
    		$$invalidate(0, painting);
    	};

    	function input1_change_input_handler_1() {
    		strokeWidth = to_number(this.value);
    		$$invalidate(12, strokeWidth);
    	}

    	function img_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			image = $$value;
    			$$invalidate(7, image);
    		});
    	}

    	const load_handler = () => {
    		$$invalidate(8, imageWidth = image.width);
    		$$invalidate(9, imageHeight = image.height);
    	};

    	function canvas0_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			canvas = $$value;
    			$$invalidate(5, canvas);
    		});
    	}

    	const wheel_handler = e => {
    		$$invalidate(12, strokeWidth += e.deltaY > 0 ? -1 : 1);
    		e.preventDefault();
    	};

    	function canvas1_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			previewCanvas = $$value;
    			$$invalidate(6, previewCanvas);
    		});
    	}

    	$$self.$capture_state = () => ({
    		onMount,
    		HistoryManager,
    		Painting,
    		PaintingViewPrinter,
    		PathCreatePrinter,
    		getPixelsOnLine,
    		readFile,
    		readFileBin,
    		saveData,
    		PointView,
    		FrameByFrameCanvasRecorder,
    		canvas,
    		previewCanvas,
    		image,
    		lastX,
    		lastY,
    		imageWidth,
    		imageHeight,
    		painting,
    		printer,
    		previewPrinter,
    		historyManager,
    		currentPath,
    		currentFile,
    		currentFileUrl,
    		chooseFirstPath,
    		animationFrame,
    		lastFrame,
    		strokeWidth,
    		erasing,
    		name,
    		downloadName,
    		saveFile,
    		mouseX,
    		mouseY,
    		mouseMove
    	});

    	$$self.$inject_state = $$props => {
    		if ('canvas' in $$props) $$invalidate(5, canvas = $$props.canvas);
    		if ('previewCanvas' in $$props) $$invalidate(6, previewCanvas = $$props.previewCanvas);
    		if ('image' in $$props) $$invalidate(7, image = $$props.image);
    		if ('lastX' in $$props) lastX = $$props.lastX;
    		if ('lastY' in $$props) lastY = $$props.lastY;
    		if ('imageWidth' in $$props) $$invalidate(8, imageWidth = $$props.imageWidth);
    		if ('imageHeight' in $$props) $$invalidate(9, imageHeight = $$props.imageHeight);
    		if ('painting' in $$props) $$invalidate(0, painting = $$props.painting);
    		if ('printer' in $$props) $$invalidate(19, printer = $$props.printer);
    		if ('previewPrinter' in $$props) $$invalidate(1, previewPrinter = $$props.previewPrinter);
    		if ('historyManager' in $$props) historyManager = $$props.historyManager;
    		if ('currentPath' in $$props) $$invalidate(2, currentPath = $$props.currentPath);
    		if ('currentFile' in $$props) $$invalidate(3, currentFile = $$props.currentFile);
    		if ('currentFileUrl' in $$props) $$invalidate(4, currentFileUrl = $$props.currentFileUrl);
    		if ('animationFrame' in $$props) $$invalidate(10, animationFrame = $$props.animationFrame);
    		if ('lastFrame' in $$props) $$invalidate(11, lastFrame = $$props.lastFrame);
    		if ('strokeWidth' in $$props) $$invalidate(12, strokeWidth = $$props.strokeWidth);
    		if ('erasing' in $$props) $$invalidate(13, erasing = $$props.erasing);
    		if ('name' in $$props) $$invalidate(14, name = $$props.name);
    		if ('saveFile' in $$props) $$invalidate(17, saveFile = $$props.saveFile);
    		if ('mouseX' in $$props) mouseX = $$props.mouseX;
    		if ('mouseY' in $$props) mouseY = $$props.mouseY;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*previewPrinter, painting*/ 3) {
    			previewPrinter != null
    			? $$invalidate(1, previewPrinter.painting = painting, previewPrinter)
    			: null;
    		}

    		if ($$self.$$.dirty[0] & /*currentPath, printer*/ 524292) {
    			(printer != null
    			? $$invalidate(19, printer.currentPath = currentPath, printer)
    			: null);
    		}

    		if ($$self.$$.dirty[0] & /*currentFileUrl, currentFile*/ 24) {
    			{
    				if (currentFileUrl != null) {
    					URL.revokeObjectURL(currentFileUrl);
    					$$invalidate(4, currentFileUrl = null);
    				}

    				if (currentFile != null) {
    					$$invalidate(4, currentFileUrl = URL.createObjectURL(currentFile));
    				}
    			}
    		}
    	};

    	return [
    		painting,
    		previewPrinter,
    		currentPath,
    		currentFile,
    		currentFileUrl,
    		canvas,
    		previewCanvas,
    		image,
    		imageWidth,
    		imageHeight,
    		animationFrame,
    		lastFrame,
    		strokeWidth,
    		erasing,
    		name,
    		chooseFirstPath,
    		downloadName,
    		saveFile,
    		mouseMove,
    		printer,
    		input0_input_handler,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3,
    		click_handler_4,
    		click_handler_5,
    		click_handler_6,
    		click_handler_7,
    		click_handler_8,
    		change_handler,
    		input0_input_handler_1,
    		change_handler_1,
    		input1_change_input_handler,
    		input2_input_handler,
    		click_handler_9,
    		input1_change_input_handler_1,
    		img_binding,
    		load_handler,
    		canvas0_binding,
    		wheel_handler,
    		canvas1_binding
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {}, null, [-1, -1]);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
        target: document.body
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
