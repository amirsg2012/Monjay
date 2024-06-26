
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    // Adapted from https://github.com/then/is-promise/blob/master/index.js
    // Distributed under MIT License https://github.com/then/is-promise/blob/master/LICENSE
    function is_promise(value) {
        return !!value && (typeof value === 'object' || typeof value === 'function') && typeof value.then === 'function';
    }
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
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function update_slot_base(slot, slot_definition, ctx, $$scope, slot_changes, get_slot_context_fn) {
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
    }
    function get_all_dirty_from_scope($$scope) {
        if ($$scope.ctx.length > 32) {
            const dirty = [];
            const length = $$scope.ctx.length / 32;
            for (let i = 0; i < length; i++) {
                dirty[i] = -1;
            }
            return dirty;
        }
        return -1;
    }
    function exclude_internal_props(props) {
        const result = {};
        for (const k in props)
            if (k[0] !== '$')
                result[k] = props[k];
        return result;
    }
    function compute_rest_props(props, keys) {
        const rest = {};
        keys = new Set(keys);
        for (const k in props)
            if (!keys.has(k) && k[0] !== '$')
                rest[k] = props[k];
        return rest;
    }
    function split_css_unit(value) {
        const split = typeof value === 'string' && value.match(/^\s*(-?[\d.]+)([^\s]*)\s*$/);
        return split ? [parseFloat(split[1]), split[2] || 'px'] : [value, 'px'];
    }

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

    const tasks = new Set();
    function run_tasks(now) {
        tasks.forEach(task => {
            if (!task.c(now)) {
                tasks.delete(task);
                task.f();
            }
        });
        if (tasks.size !== 0)
            raf(run_tasks);
    }
    /**
     * Creates a new task that runs on each raf frame
     * until it returns a falsy value or is aborted
     */
    function loop(callback) {
        let task;
        if (tasks.size === 0)
            raf(run_tasks);
        return {
            promise: new Promise(fulfill => {
                tasks.add(task = { c: callback, f: fulfill });
            }),
            abort() {
                tasks.delete(task);
            }
        };
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function append(target, node) {
        target.appendChild(node);
    }
    function get_root_for_style(node) {
        if (!node)
            return document;
        const root = node.getRootNode ? node.getRootNode() : node.ownerDocument;
        if (root && root.host) {
            return root;
        }
        return node.ownerDocument;
    }
    function append_empty_stylesheet(node) {
        const style_element = element('style');
        append_stylesheet(get_root_for_style(node), style_element);
        return style_element.sheet;
    }
    function append_stylesheet(node, style) {
        append(node.head || node, style);
        return style.sheet;
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        if (node.parentNode) {
            node.parentNode.removeChild(node);
        }
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
    function prevent_default(fn) {
        return function (event) {
            event.preventDefault();
            // @ts-ignore
            return fn.call(this, event);
        };
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    /**
     * List of attributes that should always be set through the attr method,
     * because updating them through the property setter doesn't work reliably.
     * In the example of `width`/`height`, the problem is that the setter only
     * accepts numeric values, but the attribute can also be set to a string like `50%`.
     * If this list becomes too big, rethink this approach.
     */
    const always_set_through_set_attribute = ['width', 'height'];
    function set_attributes(node, attributes) {
        // @ts-ignore
        const descriptors = Object.getOwnPropertyDescriptors(node.__proto__);
        for (const key in attributes) {
            if (attributes[key] == null) {
                node.removeAttribute(key);
            }
            else if (key === 'style') {
                node.style.cssText = attributes[key];
            }
            else if (key === '__value') {
                node.value = node[key] = attributes[key];
            }
            else if (descriptors[key] && descriptors[key].set && always_set_through_set_attribute.indexOf(key) === -1) {
                node[key] = attributes[key];
            }
            else {
                attr(node, key, attributes[key]);
            }
        }
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
    function select_option(select, value, mounting) {
        for (let i = 0; i < select.options.length; i += 1) {
            const option = select.options[i];
            if (option.__value === value) {
                option.selected = true;
                return;
            }
        }
        if (!mounting || value !== undefined) {
            select.selectedIndex = -1; // no option should be selected
        }
    }
    function select_value(select) {
        const selected_option = select.querySelector(':checked');
        return selected_option && selected_option.__value;
    }
    function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, cancelable, detail);
        return e;
    }

    // we need to store the information for multiple documents because a Svelte application could also contain iframes
    // https://github.com/sveltejs/svelte/issues/3624
    const managed_styles = new Map();
    let active = 0;
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash(str) {
        let hash = 5381;
        let i = str.length;
        while (i--)
            hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
        return hash >>> 0;
    }
    function create_style_information(doc, node) {
        const info = { stylesheet: append_empty_stylesheet(node), rules: {} };
        managed_styles.set(doc, info);
        return info;
    }
    function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
        const step = 16.666 / duration;
        let keyframes = '{\n';
        for (let p = 0; p <= 1; p += step) {
            const t = a + (b - a) * ease(p);
            keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
        }
        const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
        const name = `__svelte_${hash(rule)}_${uid}`;
        const doc = get_root_for_style(node);
        const { stylesheet, rules } = managed_styles.get(doc) || create_style_information(doc, node);
        if (!rules[name]) {
            rules[name] = true;
            stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
        }
        const animation = node.style.animation || '';
        node.style.animation = `${animation ? `${animation}, ` : ''}${name} ${duration}ms linear ${delay}ms 1 both`;
        active += 1;
        return name;
    }
    function delete_rule(node, name) {
        const previous = (node.style.animation || '').split(', ');
        const next = previous.filter(name
            ? anim => anim.indexOf(name) < 0 // remove specific animation
            : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
        );
        const deleted = previous.length - next.length;
        if (deleted) {
            node.style.animation = next.join(', ');
            active -= deleted;
            if (!active)
                clear_rules();
        }
    }
    function clear_rules() {
        raf(() => {
            if (active)
                return;
            managed_styles.forEach(info => {
                const { ownerNode } = info.stylesheet;
                // there is no ownerNode if it runs on jsdom.
                if (ownerNode)
                    detach(ownerNode);
            });
            managed_styles.clear();
        });
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
    /**
     * The `onMount` function schedules a callback to run as soon as the component has been mounted to the DOM.
     * It must be called during the component's initialisation (but doesn't need to live *inside* the component;
     * it can be called from an external module).
     *
     * `onMount` does not run inside a [server-side component](/docs#run-time-server-side-component-api).
     *
     * https://svelte.dev/docs#run-time-svelte-onmount
     */
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    /**
     * Schedules a callback to run immediately before the component is unmounted.
     *
     * Out of `onMount`, `beforeUpdate`, `afterUpdate` and `onDestroy`, this is the
     * only one that runs inside a server-side component.
     *
     * https://svelte.dev/docs#run-time-svelte-ondestroy
     */
    function onDestroy(fn) {
        get_current_component().$$.on_destroy.push(fn);
    }
    /**
     * Creates an event dispatcher that can be used to dispatch [component events](/docs#template-syntax-component-directives-on-eventname).
     * Event dispatchers are functions that can take two arguments: `name` and `detail`.
     *
     * Component events created with `createEventDispatcher` create a
     * [CustomEvent](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent).
     * These events do not [bubble](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Building_blocks/Events#Event_bubbling_and_capture).
     * The `detail` argument corresponds to the [CustomEvent.detail](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent/detail)
     * property and can contain any type of data.
     *
     * https://svelte.dev/docs#run-time-svelte-createeventdispatcher
     */
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail, { cancelable = false } = {}) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail, { cancelable });
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
                return !event.defaultPrevented;
            }
            return true;
        };
    }
    /**
     * Associates an arbitrary `context` object with the current component and the specified `key`
     * and returns that object. The context is then available to children of the component
     * (including slotted content) with `getContext`.
     *
     * Like lifecycle functions, this must be called during component initialisation.
     *
     * https://svelte.dev/docs#run-time-svelte-setcontext
     */
    function setContext(key, context) {
        get_current_component().$$.context.set(key, context);
        return context;
    }
    /**
     * Retrieves the context that belongs to the closest parent component with the specified `key`.
     * Must be called during component initialisation.
     *
     * https://svelte.dev/docs#run-time-svelte-getcontext
     */
    function getContext(key) {
        return get_current_component().$$.context.get(key);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    let render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = /* @__PURE__ */ Promise.resolve();
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
        // Do not reenter flush while dirty components are updated, as this can
        // result in an infinite loop. Instead, let the inner flush handle it.
        // Reentrancy is ok afterwards for bindings etc.
        if (flushidx !== 0) {
            return;
        }
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            try {
                while (flushidx < dirty_components.length) {
                    const component = dirty_components[flushidx];
                    flushidx++;
                    set_current_component(component);
                    update(component.$$);
                }
            }
            catch (e) {
                // reset dirty state to not end up in a deadlocked state and then rethrow
                dirty_components.length = 0;
                flushidx = 0;
                throw e;
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
    /**
     * Useful for example to execute remaining `afterUpdate` callbacks before executing `destroy`.
     */
    function flush_render_callbacks(fns) {
        const filtered = [];
        const targets = [];
        render_callbacks.forEach((c) => fns.indexOf(c) === -1 ? filtered.push(c) : targets.push(c));
        targets.forEach((c) => c());
        render_callbacks = filtered;
    }

    let promise;
    function wait() {
        if (!promise) {
            promise = Promise.resolve();
            promise.then(() => {
                promise = null;
            });
        }
        return promise;
    }
    function dispatch(node, direction, kind) {
        node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
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
        else if (callback) {
            callback();
        }
    }
    const null_transition = { duration: 0 };
    function create_in_transition(node, fn, params) {
        const options = { direction: 'in' };
        let config = fn(node, params, options);
        let running = false;
        let animation_name;
        let task;
        let uid = 0;
        function cleanup() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            if (css)
                animation_name = create_rule(node, 0, 1, duration, delay, easing, css, uid++);
            tick(0, 1);
            const start_time = now() + delay;
            const end_time = start_time + duration;
            if (task)
                task.abort();
            running = true;
            add_render_callback(() => dispatch(node, true, 'start'));
            task = loop(now => {
                if (running) {
                    if (now >= end_time) {
                        tick(1, 0);
                        dispatch(node, true, 'end');
                        cleanup();
                        return running = false;
                    }
                    if (now >= start_time) {
                        const t = easing((now - start_time) / duration);
                        tick(t, 1 - t);
                    }
                }
                return running;
            });
        }
        let started = false;
        return {
            start() {
                if (started)
                    return;
                started = true;
                delete_rule(node);
                if (is_function(config)) {
                    config = config(options);
                    wait().then(go);
                }
                else {
                    go();
                }
            },
            invalidate() {
                started = false;
            },
            end() {
                if (running) {
                    cleanup();
                    running = false;
                }
            }
        };
    }
    function create_out_transition(node, fn, params) {
        const options = { direction: 'out' };
        let config = fn(node, params, options);
        let running = true;
        let animation_name;
        const group = outros;
        group.r += 1;
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            if (css)
                animation_name = create_rule(node, 1, 0, duration, delay, easing, css);
            const start_time = now() + delay;
            const end_time = start_time + duration;
            add_render_callback(() => dispatch(node, false, 'start'));
            loop(now => {
                if (running) {
                    if (now >= end_time) {
                        tick(0, 1);
                        dispatch(node, false, 'end');
                        if (!--group.r) {
                            // this will result in `end()` being called,
                            // so we don't need to clean up here
                            run_all(group.c);
                        }
                        return false;
                    }
                    if (now >= start_time) {
                        const t = easing((now - start_time) / duration);
                        tick(1 - t, t);
                    }
                }
                return running;
            });
        }
        if (is_function(config)) {
            wait().then(() => {
                // @ts-ignore
                config = config(options);
                go();
            });
        }
        else {
            go();
        }
        return {
            end(reset) {
                if (reset && config.tick) {
                    config.tick(1, 0);
                }
                if (running) {
                    if (animation_name)
                        delete_rule(node, animation_name);
                    running = false;
                }
            }
        };
    }
    function create_bidirectional_transition(node, fn, params, intro) {
        const options = { direction: 'both' };
        let config = fn(node, params, options);
        let t = intro ? 0 : 1;
        let running_program = null;
        let pending_program = null;
        let animation_name = null;
        function clear_animation() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function init(program, duration) {
            const d = (program.b - t);
            duration *= Math.abs(d);
            return {
                a: t,
                b: program.b,
                d,
                duration,
                start: program.start,
                end: program.start + duration,
                group: program.group
            };
        }
        function go(b) {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            const program = {
                start: now() + delay,
                b
            };
            if (!b) {
                // @ts-ignore todo: improve typings
                program.group = outros;
                outros.r += 1;
            }
            if (running_program || pending_program) {
                pending_program = program;
            }
            else {
                // if this is an intro, and there's a delay, we need to do
                // an initial tick and/or apply CSS animation immediately
                if (css) {
                    clear_animation();
                    animation_name = create_rule(node, t, b, duration, delay, easing, css);
                }
                if (b)
                    tick(0, 1);
                running_program = init(program, duration);
                add_render_callback(() => dispatch(node, b, 'start'));
                loop(now => {
                    if (pending_program && now > pending_program.start) {
                        running_program = init(pending_program, duration);
                        pending_program = null;
                        dispatch(node, running_program.b, 'start');
                        if (css) {
                            clear_animation();
                            animation_name = create_rule(node, t, running_program.b, running_program.duration, 0, easing, config.css);
                        }
                    }
                    if (running_program) {
                        if (now >= running_program.end) {
                            tick(t = running_program.b, 1 - t);
                            dispatch(node, running_program.b, 'end');
                            if (!pending_program) {
                                // we're done
                                if (running_program.b) {
                                    // intro — we can tidy up immediately
                                    clear_animation();
                                }
                                else {
                                    // outro — needs to be coordinated
                                    if (!--running_program.group.r)
                                        run_all(running_program.group.c);
                                }
                            }
                            running_program = null;
                        }
                        else if (now >= running_program.start) {
                            const p = now - running_program.start;
                            t = running_program.a + running_program.d * easing(p / running_program.duration);
                            tick(t, 1 - t);
                        }
                    }
                    return !!(running_program || pending_program);
                });
            }
        }
        return {
            run(b) {
                if (is_function(config)) {
                    wait().then(() => {
                        // @ts-ignore
                        config = config(options);
                        go(b);
                    });
                }
                else {
                    go(b);
                }
            },
            end() {
                clear_animation();
                running_program = pending_program = null;
            }
        };
    }

    function handle_promise(promise, info) {
        const token = info.token = {};
        function update(type, index, key, value) {
            if (info.token !== token)
                return;
            info.resolved = value;
            let child_ctx = info.ctx;
            if (key !== undefined) {
                child_ctx = child_ctx.slice();
                child_ctx[key] = value;
            }
            const block = type && (info.current = type)(child_ctx);
            let needs_flush = false;
            if (info.block) {
                if (info.blocks) {
                    info.blocks.forEach((block, i) => {
                        if (i !== index && block) {
                            group_outros();
                            transition_out(block, 1, 1, () => {
                                if (info.blocks[i] === block) {
                                    info.blocks[i] = null;
                                }
                            });
                            check_outros();
                        }
                    });
                }
                else {
                    info.block.d(1);
                }
                block.c();
                transition_in(block, 1);
                block.m(info.mount(), info.anchor);
                needs_flush = true;
            }
            info.block = block;
            if (info.blocks)
                info.blocks[index] = block;
            if (needs_flush) {
                flush();
            }
        }
        if (is_promise(promise)) {
            const current_component = get_current_component();
            promise.then(value => {
                set_current_component(current_component);
                update(info.then, 1, info.value, value);
                set_current_component(null);
            }, error => {
                set_current_component(current_component);
                update(info.catch, 2, info.error, error);
                set_current_component(null);
                if (!info.hasCatch) {
                    throw error;
                }
            });
            // if we previously had a then/catch block, destroy it
            if (info.current !== info.pending) {
                update(info.pending, 0);
                return true;
            }
        }
        else {
            if (info.current !== info.then) {
                update(info.then, 1, info.value, promise);
                return true;
            }
            info.resolved = promise;
        }
    }
    function update_await_block_branch(info, ctx, dirty) {
        const child_ctx = ctx.slice();
        const { resolved } = info;
        if (info.current === info.then) {
            child_ctx[info.value] = resolved;
        }
        if (info.current === info.catch) {
            child_ctx[info.error] = resolved;
        }
        info.block.p(child_ctx, dirty);
    }

    function get_spread_update(levels, updates) {
        const update = {};
        const to_null_out = {};
        const accounted_for = { $$scope: 1 };
        let i = levels.length;
        while (i--) {
            const o = levels[i];
            const n = updates[i];
            if (n) {
                for (const key in o) {
                    if (!(key in n))
                        to_null_out[key] = 1;
                }
                for (const key in n) {
                    if (!accounted_for[key]) {
                        update[key] = n[key];
                        accounted_for[key] = 1;
                    }
                }
                levels[i] = n;
            }
            else {
                for (const key in o) {
                    accounted_for[key] = 1;
                }
            }
        }
        for (const key in to_null_out) {
            if (!(key in update))
                update[key] = undefined;
        }
        return update;
    }
    function get_spread_object(spread_props) {
        return typeof spread_props === 'object' && spread_props !== null ? spread_props : {};
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = component.$$.on_mount.map(run).filter(is_function);
                // if the component was destroyed immediately
                // it will update the `$$.on_destroy` reference to `null`.
                // the destructured on_destroy may still reference to the old array
                if (component.$$.on_destroy) {
                    component.$$.on_destroy.push(...new_on_destroy);
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
            flush_render_callbacks($$.after_update);
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
            ctx: [],
            // state
            props,
            update: noop,
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
            this.$destroy = noop;
        }
        $on(type, callback) {
            if (!is_function(callback)) {
                return noop;
            }
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
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.59.2' }, detail), { bubbles: true }));
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
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation, has_stop_immediate_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        if (has_stop_immediate_propagation)
            modifiers.push('stopImmediatePropagation');
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
        if (text.data === data)
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
    function construct_svelte_component_dev(component, props) {
        const error_message = 'this={...} of <svelte:component> should specify a Svelte component.';
        try {
            const instance = new component(props);
            if (!instance.$$ || !instance.$set || !instance.$on || !instance.$destroy) {
                throw new Error(error_message);
            }
            return instance;
        }
        catch (err) {
            const { message } = err;
            if (typeof message === 'string' && message.indexOf('is not a constructor') !== -1) {
                throw new Error(error_message);
            }
            else {
                throw err;
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

    const LOCATION = {};
    const ROUTER = {};
    const HISTORY = {};

    /**
     * Adapted from https://github.com/reach/router/blob/b60e6dd781d5d3a4bdaaf4de665649c0f6a7e78d/src/lib/utils.js
     * https://github.com/reach/router/blob/master/LICENSE
     */

    const PARAM = /^:(.+)/;
    const SEGMENT_POINTS = 4;
    const STATIC_POINTS = 3;
    const DYNAMIC_POINTS = 2;
    const SPLAT_PENALTY = 1;
    const ROOT_POINTS = 1;

    /**
     * Split up the URI into segments delimited by `/`
     * Strip starting/ending `/`
     * @param {string} uri
     * @return {string[]}
     */
    const segmentize = (uri) => uri.replace(/(^\/+|\/+$)/g, "").split("/");
    /**
     * Strip `str` of potential start and end `/`
     * @param {string} string
     * @return {string}
     */
    const stripSlashes = (string) => string.replace(/(^\/+|\/+$)/g, "");
    /**
     * Score a route depending on how its individual segments look
     * @param {object} route
     * @param {number} index
     * @return {object}
     */
    const rankRoute = (route, index) => {
        const score = route.default
            ? 0
            : segmentize(route.path).reduce((score, segment) => {
                  score += SEGMENT_POINTS;

                  if (segment === "") {
                      score += ROOT_POINTS;
                  } else if (PARAM.test(segment)) {
                      score += DYNAMIC_POINTS;
                  } else if (segment[0] === "*") {
                      score -= SEGMENT_POINTS + SPLAT_PENALTY;
                  } else {
                      score += STATIC_POINTS;
                  }

                  return score;
              }, 0);

        return { route, score, index };
    };
    /**
     * Give a score to all routes and sort them on that
     * If two routes have the exact same score, we go by index instead
     * @param {object[]} routes
     * @return {object[]}
     */
    const rankRoutes = (routes) =>
        routes
            .map(rankRoute)
            .sort((a, b) =>
                a.score < b.score ? 1 : a.score > b.score ? -1 : a.index - b.index
            );
    /**
     * Ranks and picks the best route to match. Each segment gets the highest
     * amount of points, then the type of segment gets an additional amount of
     * points where
     *
     *  static > dynamic > splat > root
     *
     * This way we don't have to worry about the order of our routes, let the
     * computers do it.
     *
     * A route looks like this
     *
     *  { path, default, value }
     *
     * And a returned match looks like:
     *
     *  { route, params, uri }
     *
     * @param {object[]} routes
     * @param {string} uri
     * @return {?object}
     */
    const pick = (routes, uri) => {
        let match;
        let default_;

        const [uriPathname] = uri.split("?");
        const uriSegments = segmentize(uriPathname);
        const isRootUri = uriSegments[0] === "";
        const ranked = rankRoutes(routes);

        for (let i = 0, l = ranked.length; i < l; i++) {
            const route = ranked[i].route;
            let missed = false;

            if (route.default) {
                default_ = {
                    route,
                    params: {},
                    uri,
                };
                continue;
            }

            const routeSegments = segmentize(route.path);
            const params = {};
            const max = Math.max(uriSegments.length, routeSegments.length);
            let index = 0;

            for (; index < max; index++) {
                const routeSegment = routeSegments[index];
                const uriSegment = uriSegments[index];

                if (routeSegment && routeSegment[0] === "*") {
                    // Hit a splat, just grab the rest, and return a match
                    // uri:   /files/documents/work
                    // route: /files/* or /files/*splatname
                    const splatName =
                        routeSegment === "*" ? "*" : routeSegment.slice(1);

                    params[splatName] = uriSegments
                        .slice(index)
                        .map(decodeURIComponent)
                        .join("/");
                    break;
                }

                if (typeof uriSegment === "undefined") {
                    // URI is shorter than the route, no match
                    // uri:   /users
                    // route: /users/:userId
                    missed = true;
                    break;
                }

                const dynamicMatch = PARAM.exec(routeSegment);

                if (dynamicMatch && !isRootUri) {
                    const value = decodeURIComponent(uriSegment);
                    params[dynamicMatch[1]] = value;
                } else if (routeSegment !== uriSegment) {
                    // Current segments don't match, not dynamic, not splat, so no match
                    // uri:   /users/123/settings
                    // route: /users/:id/profile
                    missed = true;
                    break;
                }
            }

            if (!missed) {
                match = {
                    route,
                    params,
                    uri: "/" + uriSegments.slice(0, index).join("/"),
                };
                break;
            }
        }

        return match || default_ || null;
    };
    /**
     * Add the query to the pathname if a query is given
     * @param {string} pathname
     * @param {string} [query]
     * @return {string}
     */
    const addQuery = (pathname, query) => pathname + (query ? `?${query}` : "");
    /**
     * Resolve URIs as though every path is a directory, no files. Relative URIs
     * in the browser can feel awkward because not only can you be "in a directory",
     * you can be "at a file", too. For example:
     *
     *  browserSpecResolve('foo', '/bar/') => /bar/foo
     *  browserSpecResolve('foo', '/bar') => /foo
     *
     * But on the command line of a file system, it's not as complicated. You can't
     * `cd` from a file, only directories. This way, links have to know less about
     * their current path. To go deeper you can do this:
     *
     *  <Link to="deeper"/>
     *  // instead of
     *  <Link to=`{${props.uri}/deeper}`/>
     *
     * Just like `cd`, if you want to go deeper from the command line, you do this:
     *
     *  cd deeper
     *  # not
     *  cd $(pwd)/deeper
     *
     * By treating every path as a directory, linking to relative paths should
     * require less contextual information and (fingers crossed) be more intuitive.
     * @param {string} to
     * @param {string} base
     * @return {string}
     */
    const resolve = (to, base) => {
        // /foo/bar, /baz/qux => /foo/bar
        if (to.startsWith("/")) return to;

        const [toPathname, toQuery] = to.split("?");
        const [basePathname] = base.split("?");
        const toSegments = segmentize(toPathname);
        const baseSegments = segmentize(basePathname);

        // ?a=b, /users?b=c => /users?a=b
        if (toSegments[0] === "") return addQuery(basePathname, toQuery);

        // profile, /users/789 => /users/789/profile

        if (!toSegments[0].startsWith(".")) {
            const pathname = baseSegments.concat(toSegments).join("/");
            return addQuery((basePathname === "/" ? "" : "/") + pathname, toQuery);
        }

        // ./       , /users/123 => /users/123
        // ../      , /users/123 => /users
        // ../..    , /users/123 => /
        // ../../one, /a/b/c/d   => /a/b/one
        // .././one , /a/b/c/d   => /a/b/c/one
        const allSegments = baseSegments.concat(toSegments);
        const segments = [];

        allSegments.forEach((segment) => {
            if (segment === "..") segments.pop();
            else if (segment !== ".") segments.push(segment);
        });

        return addQuery("/" + segments.join("/"), toQuery);
    };
    /**
     * Combines the `basepath` and the `path` into one path.
     * @param {string} basepath
     * @param {string} path
     */
    const combinePaths = (basepath, path) =>
        `${stripSlashes(
        path === "/"
            ? basepath
            : `${stripSlashes(basepath)}/${stripSlashes(path)}`
    )}/`;
    /**
     * Decides whether a given `event` should result in a navigation or not.
     * @param {object} event
     */
    const shouldNavigate = (event) =>
        !event.defaultPrevented &&
        event.button === 0 &&
        !(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey);

    const canUseDOM = () =>
        typeof window !== "undefined" &&
        "document" in window &&
        "location" in window;

    /* node_modules/svelte-routing/src/Link.svelte generated by Svelte v3.59.2 */
    const file$6 = "node_modules/svelte-routing/src/Link.svelte";
    const get_default_slot_changes$2 = dirty => ({ active: dirty & /*ariaCurrent*/ 4 });
    const get_default_slot_context$2 = ctx => ({ active: !!/*ariaCurrent*/ ctx[2] });

    function create_fragment$7(ctx) {
    	let a;
    	let current;
    	let mounted;
    	let dispose;
    	const default_slot_template = /*#slots*/ ctx[17].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[16], get_default_slot_context$2);

    	let a_levels = [
    		{ href: /*href*/ ctx[0] },
    		{ "aria-current": /*ariaCurrent*/ ctx[2] },
    		/*props*/ ctx[1],
    		/*$$restProps*/ ctx[6]
    	];

    	let a_data = {};

    	for (let i = 0; i < a_levels.length; i += 1) {
    		a_data = assign(a_data, a_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			a = element("a");
    			if (default_slot) default_slot.c();
    			set_attributes(a, a_data);
    			add_location(a, file$6, 41, 0, 1414);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);

    			if (default_slot) {
    				default_slot.m(a, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(a, "click", /*onClick*/ ctx[5], false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope, ariaCurrent*/ 65540)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[16],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[16])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[16], dirty, get_default_slot_changes$2),
    						get_default_slot_context$2
    					);
    				}
    			}

    			set_attributes(a, a_data = get_spread_update(a_levels, [
    				(!current || dirty & /*href*/ 1) && { href: /*href*/ ctx[0] },
    				(!current || dirty & /*ariaCurrent*/ 4) && { "aria-current": /*ariaCurrent*/ ctx[2] },
    				dirty & /*props*/ 2 && /*props*/ ctx[1],
    				dirty & /*$$restProps*/ 64 && /*$$restProps*/ ctx[6]
    			]));
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    			if (default_slot) default_slot.d(detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let ariaCurrent;
    	const omit_props_names = ["to","replace","state","getProps","preserveScroll"];
    	let $$restProps = compute_rest_props($$props, omit_props_names);
    	let $location;
    	let $base;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Link', slots, ['default']);
    	let { to = "#" } = $$props;
    	let { replace = false } = $$props;
    	let { state = {} } = $$props;
    	let { getProps = () => ({}) } = $$props;
    	let { preserveScroll = false } = $$props;
    	const location = getContext(LOCATION);
    	validate_store(location, 'location');
    	component_subscribe($$self, location, value => $$invalidate(14, $location = value));
    	const { base } = getContext(ROUTER);
    	validate_store(base, 'base');
    	component_subscribe($$self, base, value => $$invalidate(15, $base = value));
    	const { navigate } = getContext(HISTORY);
    	const dispatch = createEventDispatcher();
    	let href, isPartiallyCurrent, isCurrent, props;

    	const onClick = event => {
    		dispatch("click", event);

    		if (shouldNavigate(event)) {
    			event.preventDefault();

    			// Don't push another entry to the history stack when the user
    			// clicks on a Link to the page they are currently on.
    			const shouldReplace = $location.pathname === href || replace;

    			navigate(href, {
    				state,
    				replace: shouldReplace,
    				preserveScroll
    			});
    		}
    	};

    	$$self.$$set = $$new_props => {
    		$$props = assign(assign({}, $$props), exclude_internal_props($$new_props));
    		$$invalidate(6, $$restProps = compute_rest_props($$props, omit_props_names));
    		if ('to' in $$new_props) $$invalidate(7, to = $$new_props.to);
    		if ('replace' in $$new_props) $$invalidate(8, replace = $$new_props.replace);
    		if ('state' in $$new_props) $$invalidate(9, state = $$new_props.state);
    		if ('getProps' in $$new_props) $$invalidate(10, getProps = $$new_props.getProps);
    		if ('preserveScroll' in $$new_props) $$invalidate(11, preserveScroll = $$new_props.preserveScroll);
    		if ('$$scope' in $$new_props) $$invalidate(16, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		getContext,
    		HISTORY,
    		LOCATION,
    		ROUTER,
    		resolve,
    		shouldNavigate,
    		to,
    		replace,
    		state,
    		getProps,
    		preserveScroll,
    		location,
    		base,
    		navigate,
    		dispatch,
    		href,
    		isPartiallyCurrent,
    		isCurrent,
    		props,
    		onClick,
    		ariaCurrent,
    		$location,
    		$base
    	});

    	$$self.$inject_state = $$new_props => {
    		if ('to' in $$props) $$invalidate(7, to = $$new_props.to);
    		if ('replace' in $$props) $$invalidate(8, replace = $$new_props.replace);
    		if ('state' in $$props) $$invalidate(9, state = $$new_props.state);
    		if ('getProps' in $$props) $$invalidate(10, getProps = $$new_props.getProps);
    		if ('preserveScroll' in $$props) $$invalidate(11, preserveScroll = $$new_props.preserveScroll);
    		if ('href' in $$props) $$invalidate(0, href = $$new_props.href);
    		if ('isPartiallyCurrent' in $$props) $$invalidate(12, isPartiallyCurrent = $$new_props.isPartiallyCurrent);
    		if ('isCurrent' in $$props) $$invalidate(13, isCurrent = $$new_props.isCurrent);
    		if ('props' in $$props) $$invalidate(1, props = $$new_props.props);
    		if ('ariaCurrent' in $$props) $$invalidate(2, ariaCurrent = $$new_props.ariaCurrent);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*to, $base*/ 32896) {
    			$$invalidate(0, href = resolve(to, $base.uri));
    		}

    		if ($$self.$$.dirty & /*$location, href*/ 16385) {
    			$$invalidate(12, isPartiallyCurrent = $location.pathname.startsWith(href));
    		}

    		if ($$self.$$.dirty & /*href, $location*/ 16385) {
    			$$invalidate(13, isCurrent = href === $location.pathname);
    		}

    		if ($$self.$$.dirty & /*isCurrent*/ 8192) {
    			$$invalidate(2, ariaCurrent = isCurrent ? "page" : undefined);
    		}

    		$$invalidate(1, props = getProps({
    			location: $location,
    			href,
    			isPartiallyCurrent,
    			isCurrent,
    			existingProps: $$restProps
    		}));
    	};

    	return [
    		href,
    		props,
    		ariaCurrent,
    		location,
    		base,
    		onClick,
    		$$restProps,
    		to,
    		replace,
    		state,
    		getProps,
    		preserveScroll,
    		isPartiallyCurrent,
    		isCurrent,
    		$location,
    		$base,
    		$$scope,
    		slots
    	];
    }

    class Link extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {
    			to: 7,
    			replace: 8,
    			state: 9,
    			getProps: 10,
    			preserveScroll: 11
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Link",
    			options,
    			id: create_fragment$7.name
    		});
    	}

    	get to() {
    		throw new Error("<Link>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set to(value) {
    		throw new Error("<Link>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get replace() {
    		throw new Error("<Link>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set replace(value) {
    		throw new Error("<Link>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get state() {
    		throw new Error("<Link>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set state(value) {
    		throw new Error("<Link>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get getProps() {
    		throw new Error("<Link>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set getProps(value) {
    		throw new Error("<Link>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get preserveScroll() {
    		throw new Error("<Link>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set preserveScroll(value) {
    		throw new Error("<Link>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/svelte-routing/src/Route.svelte generated by Svelte v3.59.2 */
    const get_default_slot_changes$1 = dirty => ({ params: dirty & /*routeParams*/ 4 });
    const get_default_slot_context$1 = ctx => ({ params: /*routeParams*/ ctx[2] });

    // (42:0) {#if $activeRoute && $activeRoute.route === route}
    function create_if_block$3(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block_1$2, create_else_block$1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*component*/ ctx[0]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(42:0) {#if $activeRoute && $activeRoute.route === route}",
    		ctx
    	});

    	return block;
    }

    // (51:4) {:else}
    function create_else_block$1(ctx) {
    	let current;
    	const default_slot_template = /*#slots*/ ctx[8].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[7], get_default_slot_context$1);

    	const block = {
    		c: function create() {
    			if (default_slot) default_slot.c();
    		},
    		m: function mount(target, anchor) {
    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope, routeParams*/ 132)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[7],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[7])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[7], dirty, get_default_slot_changes$1),
    						get_default_slot_context$1
    					);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(51:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (43:4) {#if component}
    function create_if_block_1$2(ctx) {
    	let await_block_anchor;
    	let promise;
    	let current;

    	let info = {
    		ctx,
    		current: null,
    		token: null,
    		hasCatch: false,
    		pending: create_pending_block,
    		then: create_then_block,
    		catch: create_catch_block,
    		value: 12,
    		blocks: [,,,]
    	};

    	handle_promise(promise = /*component*/ ctx[0], info);

    	const block = {
    		c: function create() {
    			await_block_anchor = empty();
    			info.block.c();
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, await_block_anchor, anchor);
    			info.block.m(target, info.anchor = anchor);
    			info.mount = () => await_block_anchor.parentNode;
    			info.anchor = await_block_anchor;
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			info.ctx = ctx;

    			if (dirty & /*component*/ 1 && promise !== (promise = /*component*/ ctx[0]) && handle_promise(promise, info)) ; else {
    				update_await_block_branch(info, ctx, dirty);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(info.block);
    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < 3; i += 1) {
    				const block = info.blocks[i];
    				transition_out(block);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(await_block_anchor);
    			info.block.d(detaching);
    			info.token = null;
    			info = null;
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$2.name,
    		type: "if",
    		source: "(43:4) {#if component}",
    		ctx
    	});

    	return block;
    }

    // (1:0) <script>     import { getContext, onDestroy }
    function create_catch_block(ctx) {
    	const block = {
    		c: noop,
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_catch_block.name,
    		type: "catch",
    		source: "(1:0) <script>     import { getContext, onDestroy }",
    		ctx
    	});

    	return block;
    }

    // (44:49)              <svelte:component                 this={resolvedComponent?.default || resolvedComponent}
    function create_then_block(ctx) {
    	let switch_instance;
    	let switch_instance_anchor;
    	let current;
    	const switch_instance_spread_levels = [/*routeParams*/ ctx[2], /*routeProps*/ ctx[3]];
    	var switch_value = /*resolvedComponent*/ ctx[12]?.default || /*resolvedComponent*/ ctx[12];

    	function switch_props(ctx) {
    		let switch_instance_props = {};

    		for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
    			switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
    		}

    		return {
    			props: switch_instance_props,
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		switch_instance = construct_svelte_component_dev(switch_value, switch_props());
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) mount_component(switch_instance, target, anchor);
    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const switch_instance_changes = (dirty & /*routeParams, routeProps*/ 12)
    			? get_spread_update(switch_instance_spread_levels, [
    					dirty & /*routeParams*/ 4 && get_spread_object(/*routeParams*/ ctx[2]),
    					dirty & /*routeProps*/ 8 && get_spread_object(/*routeProps*/ ctx[3])
    				])
    			: {};

    			if (dirty & /*component*/ 1 && switch_value !== (switch_value = /*resolvedComponent*/ ctx[12]?.default || /*resolvedComponent*/ ctx[12])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = construct_svelte_component_dev(switch_value, switch_props());
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_then_block.name,
    		type: "then",
    		source: "(44:49)              <svelte:component                 this={resolvedComponent?.default || resolvedComponent}",
    		ctx
    	});

    	return block;
    }

    // (1:0) <script>     import { getContext, onDestroy }
    function create_pending_block(ctx) {
    	const block = {
    		c: noop,
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_pending_block.name,
    		type: "pending",
    		source: "(1:0) <script>     import { getContext, onDestroy }",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*$activeRoute*/ ctx[1] && /*$activeRoute*/ ctx[1].route === /*route*/ ctx[5] && create_if_block$3(ctx);

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
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*$activeRoute*/ ctx[1] && /*$activeRoute*/ ctx[1].route === /*route*/ ctx[5]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*$activeRoute*/ 2) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$3(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let $activeRoute;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Route', slots, ['default']);
    	let { path = "" } = $$props;
    	let { component = null } = $$props;
    	let routeParams = {};
    	let routeProps = {};
    	const { registerRoute, unregisterRoute, activeRoute } = getContext(ROUTER);
    	validate_store(activeRoute, 'activeRoute');
    	component_subscribe($$self, activeRoute, value => $$invalidate(1, $activeRoute = value));

    	const route = {
    		path,
    		// If no path prop is given, this Route will act as the default Route
    		// that is rendered if no other Route in the Router is a match.
    		default: path === ""
    	};

    	registerRoute(route);

    	onDestroy(() => {
    		unregisterRoute(route);
    	});

    	$$self.$$set = $$new_props => {
    		$$invalidate(11, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    		if ('path' in $$new_props) $$invalidate(6, path = $$new_props.path);
    		if ('component' in $$new_props) $$invalidate(0, component = $$new_props.component);
    		if ('$$scope' in $$new_props) $$invalidate(7, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		getContext,
    		onDestroy,
    		ROUTER,
    		canUseDOM,
    		path,
    		component,
    		routeParams,
    		routeProps,
    		registerRoute,
    		unregisterRoute,
    		activeRoute,
    		route,
    		$activeRoute
    	});

    	$$self.$inject_state = $$new_props => {
    		$$invalidate(11, $$props = assign(assign({}, $$props), $$new_props));
    		if ('path' in $$props) $$invalidate(6, path = $$new_props.path);
    		if ('component' in $$props) $$invalidate(0, component = $$new_props.component);
    		if ('routeParams' in $$props) $$invalidate(2, routeParams = $$new_props.routeParams);
    		if ('routeProps' in $$props) $$invalidate(3, routeProps = $$new_props.routeProps);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($activeRoute && $activeRoute.route === route) {
    			$$invalidate(2, routeParams = $activeRoute.params);
    			const { component: c, path, ...rest } = $$props;
    			$$invalidate(3, routeProps = rest);

    			if (c) {
    				if (c.toString().startsWith("class ")) $$invalidate(0, component = c); else $$invalidate(0, component = c());
    			}

    			canUseDOM() && !$activeRoute.preserveScroll && window?.scrollTo(0, 0);
    		}
    	};

    	$$props = exclude_internal_props($$props);

    	return [
    		component,
    		$activeRoute,
    		routeParams,
    		routeProps,
    		activeRoute,
    		route,
    		path,
    		$$scope,
    		slots
    	];
    }

    class Route extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, { path: 6, component: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Route",
    			options,
    			id: create_fragment$6.name
    		});
    	}

    	get path() {
    		throw new Error("<Route>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set path(value) {
    		throw new Error("<Route>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get component() {
    		throw new Error("<Route>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set component(value) {
    		throw new Error("<Route>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const subscriber_queue = [];
    /**
     * Creates a `Readable` store that allows reading by subscription.
     * @param value initial value
     * @param {StartStopNotifier} [start]
     */
    function readable(value, start) {
        return {
            subscribe: writable(value, start).subscribe
        };
    }
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=} start
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = new Set();
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (const subscriber of subscribers) {
                        subscriber[1]();
                        subscriber_queue.push(subscriber, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.add(subscriber);
            if (subscribers.size === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                subscribers.delete(subscriber);
                if (subscribers.size === 0 && stop) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }
    function derived(stores, fn, initial_value) {
        const single = !Array.isArray(stores);
        const stores_array = single
            ? [stores]
            : stores;
        const auto = fn.length < 2;
        return readable(initial_value, (set) => {
            let started = false;
            const values = [];
            let pending = 0;
            let cleanup = noop;
            const sync = () => {
                if (pending) {
                    return;
                }
                cleanup();
                const result = fn(single ? values[0] : values, set);
                if (auto) {
                    set(result);
                }
                else {
                    cleanup = is_function(result) ? result : noop;
                }
            };
            const unsubscribers = stores_array.map((store, i) => subscribe(store, (value) => {
                values[i] = value;
                pending &= ~(1 << i);
                if (started) {
                    sync();
                }
            }, () => {
                pending |= (1 << i);
            }));
            started = true;
            sync();
            return function stop() {
                run_all(unsubscribers);
                cleanup();
                // We need to set this to false because callbacks can still happen despite having unsubscribed:
                // Callbacks might already be placed in the queue which doesn't know it should no longer
                // invoke this derived store.
                started = false;
            };
        });
    }

    /**
     * Adapted from https://github.com/reach/router/blob/b60e6dd781d5d3a4bdaaf4de665649c0f6a7e78d/src/lib/history.js
     * https://github.com/reach/router/blob/master/LICENSE
     */

    const getLocation = (source) => {
        return {
            ...source.location,
            state: source.history.state,
            key: (source.history.state && source.history.state.key) || "initial",
        };
    };
    const createHistory = (source) => {
        const listeners = [];
        let location = getLocation(source);

        return {
            get location() {
                return location;
            },

            listen(listener) {
                listeners.push(listener);

                const popstateListener = () => {
                    location = getLocation(source);
                    listener({ location, action: "POP" });
                };

                source.addEventListener("popstate", popstateListener);

                return () => {
                    source.removeEventListener("popstate", popstateListener);
                    const index = listeners.indexOf(listener);
                    listeners.splice(index, 1);
                };
            },

            navigate(to, { state, replace = false, preserveScroll = false, blurActiveElement = true } = {}) {
                state = { ...state, key: Date.now() + "" };
                // try...catch iOS Safari limits to 100 pushState calls
                try {
                    if (replace) source.history.replaceState(state, "", to);
                    else source.history.pushState(state, "", to);
                } catch (e) {
                    source.location[replace ? "replace" : "assign"](to);
                }
                location = getLocation(source);
                listeners.forEach((listener) =>
                    listener({ location, action: "PUSH", preserveScroll })
                );
                if(blurActiveElement) document.activeElement.blur();
            },
        };
    };
    // Stores history entries in memory for testing or other platforms like Native
    const createMemorySource = (initialPathname = "/") => {
        let index = 0;
        const stack = [{ pathname: initialPathname, search: "" }];
        const states = [];

        return {
            get location() {
                return stack[index];
            },
            addEventListener(name, fn) {},
            removeEventListener(name, fn) {},
            history: {
                get entries() {
                    return stack;
                },
                get index() {
                    return index;
                },
                get state() {
                    return states[index];
                },
                pushState(state, _, uri) {
                    const [pathname, search = ""] = uri.split("?");
                    index++;
                    stack.push({ pathname, search });
                    states.push(state);
                },
                replaceState(state, _, uri) {
                    const [pathname, search = ""] = uri.split("?");
                    stack[index] = { pathname, search };
                    states[index] = state;
                },
            },
        };
    };
    // Global history uses window.history as the source if available,
    // otherwise a memory history
    const globalHistory = createHistory(
        canUseDOM() ? window : createMemorySource()
    );
    const { navigate } = globalHistory;

    /* node_modules/svelte-routing/src/Router.svelte generated by Svelte v3.59.2 */

    const { Object: Object_1 } = globals;
    const file$5 = "node_modules/svelte-routing/src/Router.svelte";

    const get_default_slot_changes_1 = dirty => ({
    	route: dirty & /*$activeRoute*/ 4,
    	location: dirty & /*$location*/ 2
    });

    const get_default_slot_context_1 = ctx => ({
    	route: /*$activeRoute*/ ctx[2] && /*$activeRoute*/ ctx[2].uri,
    	location: /*$location*/ ctx[1]
    });

    const get_default_slot_changes = dirty => ({
    	route: dirty & /*$activeRoute*/ 4,
    	location: dirty & /*$location*/ 2
    });

    const get_default_slot_context = ctx => ({
    	route: /*$activeRoute*/ ctx[2] && /*$activeRoute*/ ctx[2].uri,
    	location: /*$location*/ ctx[1]
    });

    // (143:0) {:else}
    function create_else_block(ctx) {
    	let current;
    	const default_slot_template = /*#slots*/ ctx[15].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[14], get_default_slot_context_1);

    	const block = {
    		c: function create() {
    			if (default_slot) default_slot.c();
    		},
    		m: function mount(target, anchor) {
    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope, $activeRoute, $location*/ 16390)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[14],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[14])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[14], dirty, get_default_slot_changes_1),
    						get_default_slot_context_1
    					);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(143:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (134:0) {#if viewtransition}
    function create_if_block$2(ctx) {
    	let previous_key = /*$location*/ ctx[1].pathname;
    	let key_block_anchor;
    	let current;
    	let key_block = create_key_block(ctx);

    	const block = {
    		c: function create() {
    			key_block.c();
    			key_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			key_block.m(target, anchor);
    			insert_dev(target, key_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$location*/ 2 && safe_not_equal(previous_key, previous_key = /*$location*/ ctx[1].pathname)) {
    				group_outros();
    				transition_out(key_block, 1, 1, noop);
    				check_outros();
    				key_block = create_key_block(ctx);
    				key_block.c();
    				transition_in(key_block, 1);
    				key_block.m(key_block_anchor.parentNode, key_block_anchor);
    			} else {
    				key_block.p(ctx, dirty);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(key_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(key_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(key_block_anchor);
    			key_block.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(134:0) {#if viewtransition}",
    		ctx
    	});

    	return block;
    }

    // (135:4) {#key $location.pathname}
    function create_key_block(ctx) {
    	let div;
    	let div_intro;
    	let div_outro;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[15].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[14], get_default_slot_context);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			add_location(div, file$5, 135, 8, 4659);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope, $activeRoute, $location*/ 16390)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[14],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[14])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[14], dirty, get_default_slot_changes),
    						get_default_slot_context
    					);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);

    			add_render_callback(() => {
    				if (!current) return;
    				if (div_outro) div_outro.end(1);
    				div_intro = create_in_transition(div, /*viewtransitionFn*/ ctx[3], {});
    				div_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			if (div_intro) div_intro.invalidate();
    			div_outro = create_out_transition(div, /*viewtransitionFn*/ ctx[3], {});
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    			if (detaching && div_outro) div_outro.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_key_block.name,
    		type: "key",
    		source: "(135:4) {#key $location.pathname}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block$2, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*viewtransition*/ ctx[0]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let $location;
    	let $routes;
    	let $base;
    	let $activeRoute;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Router', slots, ['default']);
    	let { basepath = "/" } = $$props;
    	let { url = null } = $$props;
    	let { viewtransition = null } = $$props;
    	let { history = globalHistory } = $$props;

    	const viewtransitionFn = (node, _, direction) => {
    		const vt = viewtransition(direction);
    		if (typeof vt?.fn === "function") return vt.fn(node, vt); else return vt;
    	};

    	setContext(HISTORY, history);
    	const locationContext = getContext(LOCATION);
    	const routerContext = getContext(ROUTER);
    	const routes = writable([]);
    	validate_store(routes, 'routes');
    	component_subscribe($$self, routes, value => $$invalidate(12, $routes = value));
    	const activeRoute = writable(null);
    	validate_store(activeRoute, 'activeRoute');
    	component_subscribe($$self, activeRoute, value => $$invalidate(2, $activeRoute = value));
    	let hasActiveRoute = false; // Used in SSR to synchronously set that a Route is active.

    	// If locationContext is not set, this is the topmost Router in the tree.
    	// If the `url` prop is given we force the location to it.
    	const location = locationContext || writable(url ? { pathname: url } : history.location);

    	validate_store(location, 'location');
    	component_subscribe($$self, location, value => $$invalidate(1, $location = value));

    	// If routerContext is set, the routerBase of the parent Router
    	// will be the base for this Router's descendants.
    	// If routerContext is not set, the path and resolved uri will both
    	// have the value of the basepath prop.
    	const base = routerContext
    	? routerContext.routerBase
    	: writable({ path: basepath, uri: basepath });

    	validate_store(base, 'base');
    	component_subscribe($$self, base, value => $$invalidate(13, $base = value));

    	const routerBase = derived([base, activeRoute], ([base, activeRoute]) => {
    		// If there is no activeRoute, the routerBase will be identical to the base.
    		if (!activeRoute) return base;

    		const { path: basepath } = base;
    		const { route, uri } = activeRoute;

    		// Remove the potential /* or /*splatname from
    		// the end of the child Routes relative paths.
    		const path = route.default
    		? basepath
    		: route.path.replace(/\*.*$/, "");

    		return { path, uri };
    	});

    	const registerRoute = route => {
    		const { path: basepath } = $base;
    		let { path } = route;

    		// We store the original path in the _path property so we can reuse
    		// it when the basepath changes. The only thing that matters is that
    		// the route reference is intact, so mutation is fine.
    		route._path = path;

    		route.path = combinePaths(basepath, path);

    		if (typeof window === "undefined") {
    			// In SSR we should set the activeRoute immediately if it is a match.
    			// If there are more Routes being registered after a match is found,
    			// we just skip them.
    			if (hasActiveRoute) return;

    			const matchingRoute = pick([route], $location.pathname);

    			if (matchingRoute) {
    				activeRoute.set(matchingRoute);
    				hasActiveRoute = true;
    			}
    		} else {
    			routes.update(rs => [...rs, route]);
    		}
    	};

    	const unregisterRoute = route => {
    		routes.update(rs => rs.filter(r => r !== route));
    	};

    	let preserveScroll = false;

    	if (!locationContext) {
    		// The topmost Router in the tree is responsible for updating
    		// the location store and supplying it through context.
    		onMount(() => {
    			const unlisten = history.listen(event => {
    				$$invalidate(11, preserveScroll = event.preserveScroll || false);
    				location.set(event.location);
    			});

    			return unlisten;
    		});

    		setContext(LOCATION, location);
    	}

    	setContext(ROUTER, {
    		activeRoute,
    		base,
    		routerBase,
    		registerRoute,
    		unregisterRoute
    	});

    	const writable_props = ['basepath', 'url', 'viewtransition', 'history'];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Router> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('basepath' in $$props) $$invalidate(8, basepath = $$props.basepath);
    		if ('url' in $$props) $$invalidate(9, url = $$props.url);
    		if ('viewtransition' in $$props) $$invalidate(0, viewtransition = $$props.viewtransition);
    		if ('history' in $$props) $$invalidate(10, history = $$props.history);
    		if ('$$scope' in $$props) $$invalidate(14, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		getContext,
    		onMount,
    		setContext,
    		derived,
    		writable,
    		HISTORY,
    		LOCATION,
    		ROUTER,
    		globalHistory,
    		combinePaths,
    		pick,
    		basepath,
    		url,
    		viewtransition,
    		history,
    		viewtransitionFn,
    		locationContext,
    		routerContext,
    		routes,
    		activeRoute,
    		hasActiveRoute,
    		location,
    		base,
    		routerBase,
    		registerRoute,
    		unregisterRoute,
    		preserveScroll,
    		$location,
    		$routes,
    		$base,
    		$activeRoute
    	});

    	$$self.$inject_state = $$props => {
    		if ('basepath' in $$props) $$invalidate(8, basepath = $$props.basepath);
    		if ('url' in $$props) $$invalidate(9, url = $$props.url);
    		if ('viewtransition' in $$props) $$invalidate(0, viewtransition = $$props.viewtransition);
    		if ('history' in $$props) $$invalidate(10, history = $$props.history);
    		if ('hasActiveRoute' in $$props) hasActiveRoute = $$props.hasActiveRoute;
    		if ('preserveScroll' in $$props) $$invalidate(11, preserveScroll = $$props.preserveScroll);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$base*/ 8192) {
    			// This reactive statement will update all the Routes' path when
    			// the basepath changes.
    			{
    				const { path: basepath } = $base;
    				routes.update(rs => rs.map(r => Object.assign(r, { path: combinePaths(basepath, r._path) })));
    			}
    		}

    		if ($$self.$$.dirty & /*$routes, $location, preserveScroll*/ 6146) {
    			// This reactive statement will be run when the Router is created
    			// when there are no Routes and then again the following tick, so it
    			// will not find an active Route in SSR and in the browser it will only
    			// pick an active Route after all Routes have been registered.
    			{
    				const bestMatch = pick($routes, $location.pathname);
    				activeRoute.set(bestMatch ? { ...bestMatch, preserveScroll } : bestMatch);
    			}
    		}
    	};

    	return [
    		viewtransition,
    		$location,
    		$activeRoute,
    		viewtransitionFn,
    		routes,
    		activeRoute,
    		location,
    		base,
    		basepath,
    		url,
    		history,
    		preserveScroll,
    		$routes,
    		$base,
    		$$scope,
    		slots
    	];
    }

    class Router extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {
    			basepath: 8,
    			url: 9,
    			viewtransition: 0,
    			history: 10
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Router",
    			options,
    			id: create_fragment$5.name
    		});
    	}

    	get basepath() {
    		throw new Error("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set basepath(value) {
    		throw new Error("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get url() {
    		throw new Error("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set url(value) {
    		throw new Error("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get viewtransition() {
    		throw new Error("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set viewtransition(value) {
    		throw new Error("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get history() {
    		throw new Error("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set history(value) {
    		throw new Error("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    // environment.js
    const MY_IP = 'localhost';

    /* src/components/LandingPage.svelte generated by Svelte v3.59.2 */
    const file$4 = "src/components/LandingPage.svelte";

    function create_fragment$4(ctx) {
    	let div2;
    	let div0;
    	let img;
    	let img_src_value;
    	let t0;
    	let div1;
    	let button0;
    	let t2;
    	let button1;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			img = element("img");
    			t0 = space();
    			div1 = element("div");
    			button0 = element("button");
    			button0.textContent = "مشاهده اینستاگرام";
    			t2 = space();
    			button1 = element("button");
    			button1.textContent = "صفحه منو";
    			if (!src_url_equal(img.src, img_src_value = "/logologo.png")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "Logo");
    			attr_dev(img, "class", "logo svelte-1k0kz0p");
    			add_location(img, file$4, 102, 6, 1780);
    			attr_dev(div0, "class", "container svelte-1k0kz0p");
    			add_location(div0, file$4, 101, 4, 1750);
    			attr_dev(button0, "class", "svelte-1k0kz0p");
    			add_location(button0, file$4, 105, 6, 1882);
    			attr_dev(button1, "class", "svelte-1k0kz0p");
    			add_location(button1, file$4, 106, 6, 1948);
    			attr_dev(div1, "class", "button-container svelte-1k0kz0p");
    			add_location(div1, file$4, 104, 4, 1845);
    			attr_dev(div2, "class", "landing-page svelte-1k0kz0p");
    			add_location(div2, file$4, 100, 2, 1719);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, img);
    			append_dev(div2, t0);
    			append_dev(div2, div1);
    			append_dev(div1, button0);
    			append_dev(div1, t2);
    			append_dev(div1, button1);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*goToInstagram*/ ctx[1], false, false, false, false),
    					listen_dev(button1, "click", /*goToMenuPage*/ ctx[0], false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('LandingPage', slots, []);

    	const goToMenuPage = () => {
    		navigate('/menu');
    	};

    	const goToInstagram = () => {
    		window.open('https://www.instagram.com/monjay/', '_blank');
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<LandingPage> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		navigate,
    		MY_IP,
    		goToMenuPage,
    		goToInstagram
    	});

    	return [goToMenuPage, goToInstagram];
    }

    class LandingPage extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "LandingPage",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    function cubicOut(t) {
        const f = t - 1.0;
        return f * f * f + 1.0;
    }

    function fly(node, { delay = 0, duration = 400, easing = cubicOut, x = 0, y = 0, opacity = 0 } = {}) {
        const style = getComputedStyle(node);
        const target_opacity = +style.opacity;
        const transform = style.transform === 'none' ? '' : style.transform;
        const od = target_opacity * (1 - opacity);
        const [xValue, xUnit] = split_css_unit(x);
        const [yValue, yUnit] = split_css_unit(y);
        return {
            delay,
            duration,
            easing,
            css: (t, u) => `
			transform: ${transform} translate(${(1 - t) * xValue}${xUnit}, ${(1 - t) * yValue}${yUnit});
			opacity: ${target_opacity - (od * u)}`
        };
    }

    /* src/components/Menu.svelte generated by Svelte v3.59.2 */

    const { Error: Error_1$1, console: console_1$2 } = globals;
    const file$3 = "src/components/Menu.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[9] = list[i];
    	return child_ctx;
    }

    function get_each_context_1$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[12] = list[i];
    	return child_ctx;
    }

    // (212:4) {#each categories as category}
    function create_each_block_1$1(ctx) {
    	let div;
    	let img;
    	let img_src_value;
    	let img_alt_value;
    	let t0;
    	let span;
    	let t1_value = /*category*/ ctx[12].name + "";
    	let t1;
    	let t2;
    	let div_class_value;
    	let div_transition;
    	let current;
    	let mounted;
    	let dispose;

    	function click_handler() {
    		return /*click_handler*/ ctx[4](/*category*/ ctx[12]);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			img = element("img");
    			t0 = space();
    			span = element("span");
    			t1 = text(t1_value);
    			t2 = space();
    			if (!src_url_equal(img.src, img_src_value = /*category*/ ctx[12].iconUrl)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", img_alt_value = "" + (/*category*/ ctx[12].name + " Icon"));
    			attr_dev(img, "width", "50px");
    			add_location(img, file$3, 217, 6, 5943);
    			attr_dev(span, "class", "tab-icon svelte-1yz4vo1");
    			add_location(span, file$3, 218, 6, 6017);

    			attr_dev(div, "class", div_class_value = "category-tab " + (/*selectedCategory*/ ctx[1] === /*category*/ ctx[12].name
    			? 'selected'
    			: '') + " svelte-1yz4vo1");

    			add_location(div, file$3, 213, 4, 5744);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, img);
    			append_dev(div, t0);
    			append_dev(div, span);
    			append_dev(span, t1);
    			append_dev(div, t2);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(div, "click", click_handler, false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (!current || dirty & /*categories*/ 4 && !src_url_equal(img.src, img_src_value = /*category*/ ctx[12].iconUrl)) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (!current || dirty & /*categories*/ 4 && img_alt_value !== (img_alt_value = "" + (/*category*/ ctx[12].name + " Icon"))) {
    				attr_dev(img, "alt", img_alt_value);
    			}

    			if ((!current || dirty & /*categories*/ 4) && t1_value !== (t1_value = /*category*/ ctx[12].name + "")) set_data_dev(t1, t1_value);

    			if (!current || dirty & /*selectedCategory, categories*/ 6 && div_class_value !== (div_class_value = "category-tab " + (/*selectedCategory*/ ctx[1] === /*category*/ ctx[12].name
    			? 'selected'
    			: '') + " svelte-1yz4vo1")) {
    				attr_dev(div, "class", div_class_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!current) return;
    				if (!div_transition) div_transition = create_bidirectional_transition(div, fly, { y: -10, duration: 300 }, true);
    				div_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!div_transition) div_transition = create_bidirectional_transition(div, fly, { y: -10, duration: 300 }, false);
    			div_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (detaching && div_transition) div_transition.end();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1$1.name,
    		type: "each",
    		source: "(212:4) {#each categories as category}",
    		ctx
    	});

    	return block;
    }

    // (227:6) {#if selectedCategory === 'All' || selectedCategory === item.category}
    function create_if_block$1(ctx) {
    	let div1;
    	let div0;
    	let img;
    	let img_src_value;
    	let img_alt_value;
    	let t0;
    	let h2;
    	let t1_value = /*item*/ ctx[9].name + "";
    	let t1;
    	let t2;
    	let t3;
    	let p;
    	let t4_value = /*item*/ ctx[9].price + "";
    	let t4;
    	let t5;
    	let t6;
    	let t7;
    	let t8;
    	let div1_transition;
    	let current;
    	let mounted;
    	let dispose;

    	function click_handler_1() {
    		return /*click_handler_1*/ ctx[5](/*item*/ ctx[9]);
    	}

    	let if_block0 = /*item*/ ctx[9].description != undefined && create_if_block_3(ctx);
    	let if_block1 = /*item*/ ctx[9].available && create_if_block_2$1(ctx);
    	let if_block2 = !/*item*/ ctx[9].available && create_if_block_1$1(ctx);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			img = element("img");
    			t0 = space();
    			h2 = element("h2");
    			t1 = text(t1_value);
    			t2 = space();
    			if (if_block0) if_block0.c();
    			t3 = space();
    			p = element("p");
    			t4 = text(t4_value);
    			t5 = text("T");
    			t6 = space();
    			if (if_block1) if_block1.c();
    			t7 = space();
    			if (if_block2) if_block2.c();
    			t8 = space();
    			if (!src_url_equal(img.src, img_src_value = /*item*/ ctx[9].imageUrl)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", img_alt_value = /*item*/ ctx[9].name);
    			attr_dev(img, "class", "svelte-1yz4vo1");
    			add_location(img, file$3, 229, 12, 6398);
    			attr_dev(div0, "class", "image-viewer svelte-1yz4vo1");
    			add_location(div0, file$3, 228, 10, 6315);
    			attr_dev(h2, "class", "svelte-1yz4vo1");
    			add_location(h2, file$3, 231, 10, 6469);
    			attr_dev(p, "class", "svelte-1yz4vo1");
    			add_location(p, file$3, 235, 10, 6588);
    			attr_dev(div1, "class", "menu-item svelte-1yz4vo1");
    			add_location(div1, file$3, 227, 8, 6238);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, img);
    			append_dev(div1, t0);
    			append_dev(div1, h2);
    			append_dev(h2, t1);
    			append_dev(div1, t2);
    			if (if_block0) if_block0.m(div1, null);
    			append_dev(div1, t3);
    			append_dev(div1, p);
    			append_dev(p, t4);
    			append_dev(p, t5);
    			append_dev(div1, t6);
    			if (if_block1) if_block1.m(div1, null);
    			append_dev(div1, t7);
    			if (if_block2) if_block2.m(div1, null);
    			append_dev(div1, t8);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(div0, "click", click_handler_1, false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (!current || dirty & /*menuItems*/ 1 && !src_url_equal(img.src, img_src_value = /*item*/ ctx[9].imageUrl)) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (!current || dirty & /*menuItems*/ 1 && img_alt_value !== (img_alt_value = /*item*/ ctx[9].name)) {
    				attr_dev(img, "alt", img_alt_value);
    			}

    			if ((!current || dirty & /*menuItems*/ 1) && t1_value !== (t1_value = /*item*/ ctx[9].name + "")) set_data_dev(t1, t1_value);

    			if (/*item*/ ctx[9].description != undefined) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_3(ctx);
    					if_block0.c();
    					if_block0.m(div1, t3);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if ((!current || dirty & /*menuItems*/ 1) && t4_value !== (t4_value = /*item*/ ctx[9].price + "")) set_data_dev(t4, t4_value);

    			if (/*item*/ ctx[9].available) {
    				if (if_block1) ; else {
    					if_block1 = create_if_block_2$1(ctx);
    					if_block1.c();
    					if_block1.m(div1, t7);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (!/*item*/ ctx[9].available) {
    				if (if_block2) ; else {
    					if_block2 = create_if_block_1$1(ctx);
    					if_block2.c();
    					if_block2.m(div1, t8);
    				}
    			} else if (if_block2) {
    				if_block2.d(1);
    				if_block2 = null;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!current) return;
    				if (!div1_transition) div1_transition = create_bidirectional_transition(div1, fly, { y: -10, duration: 300 }, true);
    				div1_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!div1_transition) div1_transition = create_bidirectional_transition(div1, fly, { y: -10, duration: 300 }, false);
    			div1_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			if (if_block2) if_block2.d();
    			if (detaching && div1_transition) div1_transition.end();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(227:6) {#if selectedCategory === 'All' || selectedCategory === item.category}",
    		ctx
    	});

    	return block;
    }

    // (233:5) {#if item.description != undefined}
    function create_if_block_3(ctx) {
    	let p;
    	let t_value = /*item*/ ctx[9].description + "";
    	let t;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t = text(t_value);
    			attr_dev(p, "class", "svelte-1yz4vo1");
    			add_location(p, file$3, 233, 10, 6541);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*menuItems*/ 1 && t_value !== (t_value = /*item*/ ctx[9].description + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(233:5) {#if item.description != undefined}",
    		ctx
    	});

    	return block;
    }

    // (237:5) {#if item.available}
    function create_if_block_2$1(ctx) {
    	let button;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "موجود";
    			attr_dev(button, "class", "button_1 svelte-1yz4vo1");
    			add_location(button, file$3, 237, 10, 6645);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$1.name,
    		type: "if",
    		source: "(237:5) {#if item.available}",
    		ctx
    	});

    	return block;
    }

    // (240:5) {#if !(item.available)}
    function create_if_block_1$1(ctx) {
    	let button;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "ناموجود";
    			attr_dev(button, "class", "button_2 svelte-1yz4vo1");
    			add_location(button, file$3, 240, 4, 6732);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(240:5) {#if !(item.available)}",
    		ctx
    	});

    	return block;
    }

    // (226:4) {#each menuItems as item}
    function create_each_block$1(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = (/*selectedCategory*/ ctx[1] === 'All' || /*selectedCategory*/ ctx[1] === /*item*/ ctx[9].category) && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (/*selectedCategory*/ ctx[1] === 'All' || /*selectedCategory*/ ctx[1] === /*item*/ ctx[9].category) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*selectedCategory, menuItems*/ 3) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(226:4) {#each menuItems as item}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let div2;
    	let img;
    	let img_src_value;
    	let t0;
    	let div0;
    	let t1;
    	let div1;
    	let current;
    	let each_value_1 = /*categories*/ ctx[2];
    	validate_each_argument(each_value_1);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1$1(get_each_context_1$1(ctx, each_value_1, i));
    	}

    	const out = i => transition_out(each_blocks_1[i], 1, 1, () => {
    		each_blocks_1[i] = null;
    	});

    	let each_value = /*menuItems*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const out_1 = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			img = element("img");
    			t0 = space();
    			div0 = element("div");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t1 = space();
    			div1 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(img, "class", "topper svelte-1yz4vo1");
    			if (!src_url_equal(img.src, img_src_value = "/logologo.png")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "Logo Icon");
    			attr_dev(img, "width", "300px");
    			add_location(img, file$3, 204, 2, 5358);
    			attr_dev(div0, "class", "category-tabs svelte-1yz4vo1");
    			add_location(div0, file$3, 207, 2, 5498);
    			attr_dev(div1, "class", "menu-grid svelte-1yz4vo1");
    			add_location(div1, file$3, 224, 2, 6099);
    			attr_dev(div2, "class", "menu-page");
    			add_location(div2, file$3, 203, 0, 5332);
    		},
    		l: function claim(nodes) {
    			throw new Error_1$1("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, img);
    			append_dev(div2, t0);
    			append_dev(div2, div0);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				if (each_blocks_1[i]) {
    					each_blocks_1[i].m(div0, null);
    				}
    			}

    			append_dev(div2, t1);
    			append_dev(div2, div1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(div1, null);
    				}
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*selectedCategory, categories*/ 6) {
    				each_value_1 = /*categories*/ ctx[2];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1$1(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    						transition_in(each_blocks_1[i], 1);
    					} else {
    						each_blocks_1[i] = create_each_block_1$1(child_ctx);
    						each_blocks_1[i].c();
    						transition_in(each_blocks_1[i], 1);
    						each_blocks_1[i].m(div0, null);
    					}
    				}

    				group_outros();

    				for (i = each_value_1.length; i < each_blocks_1.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}

    			if (dirty & /*menuItems, undefined, handleClick, selectedCategory*/ 11) {
    				each_value = /*menuItems*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div1, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out_1(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value_1.length; i += 1) {
    				transition_in(each_blocks_1[i]);
    			}

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks_1 = each_blocks_1.filter(Boolean);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				transition_out(each_blocks_1[i]);
    			}

    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			destroy_each(each_blocks_1, detaching);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function preventScroll(event) {
    	event.preventDefault();
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Menu', slots, []);
    	let menuItems = [];
    	let selectedCategory = 'All';
    	let categories = [];
    	const dispatch = createEventDispatcher(); // Create event dispatcher

    	// Function to dispatch the 'imageClicked' event when an image is clicked
    	function handleClick(imageUrl) {
    		dispatch('imageClicked', { imageUrl });
    	}

    	async function fetchMenuItems() {
    		try {
    			const response = await fetch('https://' + MY_IP + ':5000/api/menu');

    			if (!response.ok) {
    				throw new Error('Failed to fetch menu items');
    			}

    			$$invalidate(0, menuItems = await response.json());
    			$$invalidate(0, menuItems = menuItems.slice().sort((a, b) => a.order - b.order));
    		} catch(error) {
    			console.error('Error fetching menu items:', error); // Set selectedCategory to the first category in menuItems array
    		}
    	}

    	// Function to fetch categories
    	async function fetchCategories() {
    		try {
    			const response = await fetch('https://' + MY_IP + ':5000/api/categories');

    			if (!response.ok) {
    				throw new Error('Failed to fetch categories');
    			}

    			$$invalidate(2, categories = await response.json());
    			$$invalidate(2, categories = categories.slice().sort((a, b) => a.order - b.order));

    			// Set selectedCategory to the first category in categories array
    			$$invalidate(1, selectedCategory = categories[0].name);
    		} catch(error) {
    			console.error('Error fetching categories:', error);
    		}
    	}

    	onMount(() => {
    		fetchMenuItems();
    		fetchCategories();
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$2.warn(`<Menu> was created with unknown prop '${key}'`);
    	});

    	const click_handler = category => $$invalidate(1, selectedCategory = category.name);
    	const click_handler_1 = item => handleClick(item.imageUrl);

    	$$self.$capture_state = () => ({
    		onMount,
    		navigate,
    		fly,
    		createEventDispatcher,
    		MY_IP,
    		menuItems,
    		selectedCategory,
    		categories,
    		dispatch,
    		handleClick,
    		fetchMenuItems,
    		fetchCategories,
    		preventScroll
    	});

    	$$self.$inject_state = $$props => {
    		if ('menuItems' in $$props) $$invalidate(0, menuItems = $$props.menuItems);
    		if ('selectedCategory' in $$props) $$invalidate(1, selectedCategory = $$props.selectedCategory);
    		if ('categories' in $$props) $$invalidate(2, categories = $$props.categories);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		menuItems,
    		selectedCategory,
    		categories,
    		handleClick,
    		click_handler,
    		click_handler_1
    	];
    }

    class Menu extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Menu",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src/components/AdminPanel.svelte generated by Svelte v3.59.2 */

    const { Error: Error_1, console: console_1$1 } = globals;
    const file$2 = "src/components/AdminPanel.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[47] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[50] = list[i];
    	return child_ctx;
    }

    function get_each_context_2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[47] = list[i];
    	return child_ctx;
    }

    function get_each_context_3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[47] = list[i];
    	return child_ctx;
    }

    // (522:24) {#each categories as category}
    function create_each_block_3(ctx) {
    	let option;
    	let t_value = /*category*/ ctx[47].name + "";
    	let t;
    	let option_value_value;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t = text(t_value);
    			option.__value = option_value_value = /*category*/ ctx[47].name;
    			option.value = option.__value;
    			add_location(option, file$2, 522, 28, 17155);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*categories*/ 4 && t_value !== (t_value = /*category*/ ctx[47].name + "")) set_data_dev(t, t_value);

    			if (dirty[0] & /*categories*/ 4 && option_value_value !== (option_value_value = /*category*/ ctx[47].name)) {
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
    		id: create_each_block_3.name,
    		type: "each",
    		source: "(522:24) {#each categories as category}",
    		ctx
    	});

    	return block;
    }

    // (570:20) {#each categories as category}
    function create_each_block_2(ctx) {
    	let option;
    	let t_value = /*category*/ ctx[47].name + "";
    	let t;
    	let option_value_value;
    	let mounted;
    	let dispose;

    	function click_handler() {
    		return /*click_handler*/ ctx[26](/*category*/ ctx[47]);
    	}

    	const block = {
    		c: function create() {
    			option = element("option");
    			t = text(t_value);
    			option.__value = option_value_value = /*category*/ ctx[47];
    			option.value = option.__value;
    			add_location(option, file$2, 570, 20, 19133);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t);

    			if (!mounted) {
    				dispose = listen_dev(option, "click", click_handler, false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty[0] & /*categories*/ 4 && t_value !== (t_value = /*category*/ ctx[47].name + "")) set_data_dev(t, t_value);

    			if (dirty[0] & /*categories*/ 4 && option_value_value !== (option_value_value = /*category*/ ctx[47])) {
    				prop_dev(option, "__value", option_value_value);
    				option.value = option.__value;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_2.name,
    		type: "each",
    		source: "(570:20) {#each categories as category}",
    		ctx
    	});

    	return block;
    }

    // (577:16) {#each menuItems.filter(item => item.category === selectedCategory.name || selectedCategory === '') as item}
    function create_each_block_1(ctx) {
    	let label;
    	let input;
    	let input_value_value;
    	let input_checked_value;
    	let t0;
    	let span;
    	let t1_value = /*item*/ ctx[50].name + "";
    	let t1;
    	let t2;
    	let mounted;
    	let dispose;

    	function click_handler_1() {
    		return /*click_handler_1*/ ctx[29](/*item*/ ctx[50]);
    	}

    	const block = {
    		c: function create() {
    			label = element("label");
    			input = element("input");
    			t0 = space();
    			span = element("span");
    			t1 = text(t1_value);
    			t2 = space();
    			attr_dev(input, "type", "radio");
    			attr_dev(input, "name", "selectedItem");
    			input.value = input_value_value = /*item*/ ctx[50]._id;
    			input.checked = input_checked_value = /*selectedItemId*/ ctx[4] === /*item*/ ctx[50]._id;
    			attr_dev(input, "class", "svelte-3pa71");
    			add_location(input, file$2, 578, 24, 19615);
    			attr_dev(span, "class", "svelte-3pa71");
    			add_location(span, file$2, 579, 24, 19788);
    			attr_dev(label, "class", "item-row svelte-3pa71");
    			add_location(label, file$2, 577, 20, 19566);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, label, anchor);
    			append_dev(label, input);
    			append_dev(label, t0);
    			append_dev(label, span);
    			append_dev(span, t1);
    			append_dev(label, t2);

    			if (!mounted) {
    				dispose = listen_dev(input, "click", click_handler_1, false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty[0] & /*menuItems, selectedCategory, categories*/ 13 && input_value_value !== (input_value_value = /*item*/ ctx[50]._id)) {
    				prop_dev(input, "value", input_value_value);
    			}

    			if (dirty[0] & /*selectedItemId, menuItems, selectedCategory, categories*/ 29 && input_checked_value !== (input_checked_value = /*selectedItemId*/ ctx[4] === /*item*/ ctx[50]._id)) {
    				prop_dev(input, "checked", input_checked_value);
    			}

    			if (dirty[0] & /*menuItems, selectedCategory*/ 9 && t1_value !== (t1_value = /*item*/ ctx[50].name + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(label);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(577:16) {#each menuItems.filter(item => item.category === selectedCategory.name || selectedCategory === '') as item}",
    		ctx
    	});

    	return block;
    }

    // (585:12) {#if selectedCategory != ''}
    function create_if_block_2(ctx) {
    	let img0;
    	let img0_src_value;
    	let t;
    	let img1;
    	let img1_src_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			img0 = element("img");
    			t = space();
    			img1 = element("img");
    			if (!src_url_equal(img0.src, img0_src_value = "/up.png")) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "alt", "Logo");
    			attr_dev(img0, "class", "logo svelte-3pa71");
    			add_location(img0, file$2, 585, 12, 20000);
    			if (!src_url_equal(img1.src, img1_src_value = "/down.png")) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "alt", "Logo");
    			attr_dev(img1, "class", "logo svelte-3pa71");
    			add_location(img1, file$2, 586, 12, 20121);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img0, anchor);
    			insert_dev(target, t, anchor);
    			insert_dev(target, img1, anchor);

    			if (!mounted) {
    				dispose = [
    					listen_dev(
    						img0,
    						"click",
    						function () {
    							if (is_function(/*updateItemOrder*/ ctx[20](/*selectedItemId*/ ctx[4], /*selectedItem*/ ctx[5].order - 1))) /*updateItemOrder*/ ctx[20](/*selectedItemId*/ ctx[4], /*selectedItem*/ ctx[5].order - 1).apply(this, arguments);
    						},
    						false,
    						false,
    						false,
    						false
    					),
    					listen_dev(
    						img1,
    						"click",
    						function () {
    							if (is_function(/*updateItemOrder*/ ctx[20](/*selectedItemId*/ ctx[4], /*selectedItem*/ ctx[5].order + 1))) /*updateItemOrder*/ ctx[20](/*selectedItemId*/ ctx[4], /*selectedItem*/ ctx[5].order + 1).apply(this, arguments);
    						},
    						false,
    						false,
    						false,
    						false
    					)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img0);
    			if (detaching) detach_dev(t);
    			if (detaching) detach_dev(img1);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(585:12) {#if selectedCategory != ''}",
    		ctx
    	});

    	return block;
    }

    // (593:8) {#if selectedItemId}
    function create_if_block_1(ctx) {
    	let div1;
    	let h2;
    	let t1;
    	let form;
    	let label0;
    	let t2;
    	let input0;
    	let t3;
    	let label1;
    	let t4;
    	let textarea;
    	let t5;
    	let label2;
    	let t6;
    	let input1;
    	let t7;
    	let label3;
    	let t8;
    	let input2;
    	let t9;
    	let div0;
    	let label4;
    	let t11;
    	let img;
    	let img_src_value;
    	let t12;
    	let label5;
    	let t13;
    	let input3;
    	let t14;
    	let button0;
    	let t16;
    	let button1;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			h2 = element("h2");
    			h2.textContent = "Modify Item";
    			t1 = space();
    			form = element("form");
    			label0 = element("label");
    			t2 = text("Name:\n                    ");
    			input0 = element("input");
    			t3 = space();
    			label1 = element("label");
    			t4 = text("Description:\n                    ");
    			textarea = element("textarea");
    			t5 = space();
    			label2 = element("label");
    			t6 = text("Price:\n                    ");
    			input1 = element("input");
    			t7 = space();
    			label3 = element("label");
    			t8 = text("Available:\n                    ");
    			input2 = element("input");
    			t9 = space();
    			div0 = element("div");
    			label4 = element("label");
    			label4.textContent = "Current Image:";
    			t11 = space();
    			img = element("img");
    			t12 = space();
    			label5 = element("label");
    			t13 = text("Update Image:\n                    ");
    			input3 = element("input");
    			t14 = space();
    			button0 = element("button");
    			button0.textContent = "Delete";
    			t16 = space();
    			button1 = element("button");
    			button1.textContent = "Apply";
    			add_location(h2, file$2, 594, 12, 20420);
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "class", "svelte-3pa71");
    			add_location(input0, file$2, 599, 20, 20634);
    			attr_dev(label0, "class", "svelte-3pa71");
    			add_location(label0, file$2, 597, 16, 20580);
    			attr_dev(textarea, "rows", "3");
    			attr_dev(textarea, "class", "svelte-3pa71");
    			add_location(textarea, file$2, 603, 20, 20787);
    			attr_dev(label1, "class", "svelte-3pa71");
    			add_location(label1, file$2, 601, 16, 20726);
    			attr_dev(input1, "type", "number");
    			attr_dev(input1, "step", "0.01");
    			attr_dev(input1, "class", "svelte-3pa71");
    			add_location(input1, file$2, 607, 20, 20952);
    			attr_dev(label2, "class", "svelte-3pa71");
    			add_location(label2, file$2, 605, 16, 20897);
    			attr_dev(input2, "type", "checkbox");
    			attr_dev(input2, "class", "svelte-3pa71");
    			add_location(input2, file$2, 611, 20, 21118);
    			attr_dev(label3, "class", "svelte-3pa71");
    			add_location(label3, file$2, 609, 16, 21059);
    			attr_dev(label4, "class", "svelte-3pa71");
    			add_location(label4, file$2, 615, 20, 21320);
    			if (!src_url_equal(img.src, img_src_value = /*selectedItem*/ ctx[5].imageUrl)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "Selected Item Image");
    			attr_dev(img, "class", "svelte-3pa71");
    			add_location(img, file$2, 618, 20, 21416);
    			attr_dev(div0, "class", "image-container svelte-3pa71");
    			add_location(div0, file$2, 614, 16, 21270);
    			attr_dev(input3, "type", "file");
    			attr_dev(input3, "accept", "image/*");
    			attr_dev(input3, "name", "image");
    			attr_dev(input3, "class", "svelte-3pa71");
    			add_location(input3, file$2, 623, 20, 21633);
    			attr_dev(label5, "class", "svelte-3pa71");
    			add_location(label5, file$2, 621, 16, 21571);
    			attr_dev(button0, "type", "button");
    			attr_dev(button0, "class", "svelte-3pa71");
    			add_location(button0, file$2, 626, 16, 21793);
    			attr_dev(button1, "type", "submit");
    			attr_dev(button1, "class", "svelte-3pa71");
    			add_location(button1, file$2, 628, 16, 21916);
    			add_location(form, file$2, 596, 12, 20511);
    			attr_dev(div1, "class", "add-item-card svelte-3pa71");
    			add_location(div1, file$2, 593, 8, 20380);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, h2);
    			append_dev(div1, t1);
    			append_dev(div1, form);
    			append_dev(form, label0);
    			append_dev(label0, t2);
    			append_dev(label0, input0);
    			set_input_value(input0, /*selectedItem*/ ctx[5].name);
    			append_dev(form, t3);
    			append_dev(form, label1);
    			append_dev(label1, t4);
    			append_dev(label1, textarea);
    			set_input_value(textarea, /*selectedItem*/ ctx[5].description);
    			append_dev(form, t5);
    			append_dev(form, label2);
    			append_dev(label2, t6);
    			append_dev(label2, input1);
    			set_input_value(input1, /*selectedItem*/ ctx[5].price);
    			append_dev(form, t7);
    			append_dev(form, label3);
    			append_dev(label3, t8);
    			append_dev(label3, input2);
    			input2.checked = /*selectedItem*/ ctx[5].available;
    			append_dev(form, t9);
    			append_dev(form, div0);
    			append_dev(div0, label4);
    			append_dev(div0, t11);
    			append_dev(div0, img);
    			append_dev(form, t12);
    			append_dev(form, label5);
    			append_dev(label5, t13);
    			append_dev(label5, input3);
    			append_dev(form, t14);
    			append_dev(form, button0);
    			append_dev(form, t16);
    			append_dev(form, button1);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler_1*/ ctx[30]),
    					listen_dev(textarea, "input", /*textarea_input_handler*/ ctx[31]),
    					listen_dev(input1, "input", /*input1_input_handler_1*/ ctx[32]),
    					listen_dev(input2, "change", /*input2_change_handler_1*/ ctx[33]),
    					listen_dev(input3, "change", /*handleImageUpload*/ ctx[13], false, false, false, false),
    					listen_dev(button0, "click", /*deleteSelectedItem*/ ctx[17], false, false, false, false),
    					listen_dev(form, "submit", prevent_default(/*updateSelectedItem*/ ctx[18]), false, true, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*selectedItem*/ 32 && input0.value !== /*selectedItem*/ ctx[5].name) {
    				set_input_value(input0, /*selectedItem*/ ctx[5].name);
    			}

    			if (dirty[0] & /*selectedItem*/ 32) {
    				set_input_value(textarea, /*selectedItem*/ ctx[5].description);
    			}

    			if (dirty[0] & /*selectedItem*/ 32 && to_number(input1.value) !== /*selectedItem*/ ctx[5].price) {
    				set_input_value(input1, /*selectedItem*/ ctx[5].price);
    			}

    			if (dirty[0] & /*selectedItem*/ 32) {
    				input2.checked = /*selectedItem*/ ctx[5].available;
    			}

    			if (dirty[0] & /*selectedItem*/ 32 && !src_url_equal(img.src, img_src_value = /*selectedItem*/ ctx[5].imageUrl)) {
    				attr_dev(img, "src", img_src_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(593:8) {#if selectedItemId}",
    		ctx
    	});

    	return block;
    }

    // (659:16) {#each categories as category}
    function create_each_block(ctx) {
    	let label;
    	let input;
    	let input_value_value;
    	let input_checked_value;
    	let t0;
    	let span;
    	let t1_value = /*category*/ ctx[47].name + "";
    	let t1;
    	let t2;
    	let mounted;
    	let dispose;

    	function change_handler() {
    		return /*change_handler*/ ctx[36](/*category*/ ctx[47]);
    	}

    	const block = {
    		c: function create() {
    			label = element("label");
    			input = element("input");
    			t0 = space();
    			span = element("span");
    			t1 = text(t1_value);
    			t2 = space();
    			attr_dev(input, "type", "radio");
    			attr_dev(input, "name", "selectedCategory");
    			input.value = input_value_value = /*category*/ ctx[47]._id;
    			input.checked = input_checked_value = /*selectedCategoryId*/ ctx[7] === /*category*/ ctx[47]._id;
    			attr_dev(input, "class", "svelte-3pa71");
    			add_location(input, file$2, 660, 24, 23150);
    			attr_dev(span, "class", "svelte-3pa71");
    			add_location(span, file$2, 661, 24, 23348);
    			attr_dev(label, "class", "category-row svelte-3pa71");
    			add_location(label, file$2, 659, 20, 23097);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, label, anchor);
    			append_dev(label, input);
    			append_dev(label, t0);
    			append_dev(label, span);
    			append_dev(span, t1);
    			append_dev(label, t2);

    			if (!mounted) {
    				dispose = listen_dev(input, "change", change_handler, false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty[0] & /*categories*/ 4 && input_value_value !== (input_value_value = /*category*/ ctx[47]._id)) {
    				prop_dev(input, "value", input_value_value);
    			}

    			if (dirty[0] & /*selectedCategoryId, categories*/ 132 && input_checked_value !== (input_checked_value = /*selectedCategoryId*/ ctx[7] === /*category*/ ctx[47]._id)) {
    				prop_dev(input, "checked", input_checked_value);
    			}

    			if (dirty[0] & /*categories*/ 4 && t1_value !== (t1_value = /*category*/ ctx[47].name + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(label);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(659:16) {#each categories as category}",
    		ctx
    	});

    	return block;
    }

    // (676:4) {#if selectedCategoryId}
    function create_if_block(ctx) {
    	let div1;
    	let h2;
    	let t1;
    	let form;
    	let label0;
    	let t2;
    	let input0;
    	let t3;
    	let label1;
    	let t4;
    	let textarea;
    	let t5;
    	let div0;
    	let label2;
    	let t7;
    	let img;
    	let img_src_value;
    	let t8;
    	let label3;
    	let t9;
    	let input1;
    	let t10;
    	let button0;
    	let t12;
    	let button1;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			h2 = element("h2");
    			h2.textContent = "Modify Category";
    			t1 = space();
    			form = element("form");
    			label0 = element("label");
    			t2 = text("Name:\n                ");
    			input0 = element("input");
    			t3 = space();
    			label1 = element("label");
    			t4 = text("Description:\n                ");
    			textarea = element("textarea");
    			t5 = space();
    			div0 = element("div");
    			label2 = element("label");
    			label2.textContent = "Current Icon:";
    			t7 = space();
    			img = element("img");
    			t8 = space();
    			label3 = element("label");
    			t9 = text("Update Icon:\n                ");
    			input1 = element("input");
    			t10 = space();
    			button0 = element("button");
    			button0.textContent = "Delete";
    			t12 = space();
    			button1 = element("button");
    			button1.textContent = "Apply";
    			add_location(h2, file$2, 677, 8, 24246);
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "class", "svelte-3pa71");
    			add_location(input0, file$2, 681, 16, 24394);
    			attr_dev(label0, "class", "svelte-3pa71");
    			add_location(label0, file$2, 679, 12, 24348);
    			attr_dev(textarea, "rows", "3");
    			attr_dev(textarea, "class", "svelte-3pa71");
    			add_location(textarea, file$2, 685, 16, 24539);
    			attr_dev(label1, "class", "svelte-3pa71");
    			add_location(label1, file$2, 683, 12, 24486);
    			attr_dev(label2, "class", "svelte-3pa71");
    			add_location(label2, file$2, 689, 16, 24748);
    			if (!src_url_equal(img.src, img_src_value = /*selectedCategoryItem*/ ctx[8].iconUrl)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "Selected Category Icon");
    			attr_dev(img, "class", "svelte-3pa71");
    			add_location(img, file$2, 692, 16, 24831);
    			attr_dev(div0, "class", "image-container svelte-3pa71");
    			add_location(div0, file$2, 688, 12, 24702);
    			attr_dev(input1, "type", "file");
    			attr_dev(input1, "accept", "image/*");
    			attr_dev(input1, "name", "icon");
    			attr_dev(input1, "class", "svelte-3pa71");
    			add_location(input1, file$2, 697, 16, 25045);
    			attr_dev(label3, "class", "svelte-3pa71");
    			add_location(label3, file$2, 695, 12, 24992);
    			attr_dev(button0, "type", "button");
    			attr_dev(button0, "class", "svelte-3pa71");
    			add_location(button0, file$2, 700, 12, 25199);
    			attr_dev(button1, "type", "submit");
    			attr_dev(button1, "class", "svelte-3pa71");
    			add_location(button1, file$2, 702, 12, 25318);
    			add_location(form, file$2, 678, 8, 24279);
    			attr_dev(div1, "class", "add-item-card svelte-3pa71");
    			add_location(div1, file$2, 676, 4, 24210);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, h2);
    			append_dev(div1, t1);
    			append_dev(div1, form);
    			append_dev(form, label0);
    			append_dev(label0, t2);
    			append_dev(label0, input0);
    			set_input_value(input0, /*selectedCategoryItem*/ ctx[8].name);
    			append_dev(form, t3);
    			append_dev(form, label1);
    			append_dev(label1, t4);
    			append_dev(label1, textarea);
    			set_input_value(textarea, /*selectedCategoryItem*/ ctx[8].description);
    			append_dev(form, t5);
    			append_dev(form, div0);
    			append_dev(div0, label2);
    			append_dev(div0, t7);
    			append_dev(div0, img);
    			append_dev(form, t8);
    			append_dev(form, label3);
    			append_dev(label3, t9);
    			append_dev(label3, input1);
    			append_dev(form, t10);
    			append_dev(form, button0);
    			append_dev(form, t12);
    			append_dev(form, button1);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler_2*/ ctx[37]),
    					listen_dev(textarea, "input", /*textarea_input_handler_1*/ ctx[38]),
    					listen_dev(input1, "change", /*handleCategoryIconUpload*/ ctx[12], false, false, false, false),
    					listen_dev(button0, "click", /*deleteSelectedCategory*/ ctx[14], false, false, false, false),
    					listen_dev(form, "submit", prevent_default(/*updateSelectedCategory*/ ctx[11]), false, true, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*selectedCategoryItem*/ 256 && input0.value !== /*selectedCategoryItem*/ ctx[8].name) {
    				set_input_value(input0, /*selectedCategoryItem*/ ctx[8].name);
    			}

    			if (dirty[0] & /*selectedCategoryItem*/ 256) {
    				set_input_value(textarea, /*selectedCategoryItem*/ ctx[8].description);
    			}

    			if (dirty[0] & /*selectedCategoryItem*/ 256 && !src_url_equal(img.src, img_src_value = /*selectedCategoryItem*/ ctx[8].iconUrl)) {
    				attr_dev(img, "src", img_src_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(676:4) {#if selectedCategoryId}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let div7;
    	let div6;
    	let h1;
    	let t1;
    	let div1;
    	let h20;
    	let t3;
    	let form0;
    	let label0;
    	let t4;
    	let select0;
    	let t5;
    	let label1;
    	let t6;
    	let input0;
    	let t7;
    	let label2;
    	let t8;
    	let textarea0;
    	let t9;
    	let label3;
    	let t10;
    	let input1;
    	let t11;
    	let label4;
    	let t12;
    	let input2;
    	let t13;
    	let label5;
    	let t14;
    	let div0;
    	let img0;
    	let img0_src_value;
    	let t15;
    	let input3;
    	let t16;
    	let button0;
    	let t18;
    	let div2;
    	let h21;
    	let t20;
    	let select1;
    	let t21;
    	let ul0;
    	let t22;
    	let t23;
    	let t24;
    	let div3;
    	let h22;
    	let t26;
    	let form1;
    	let label6;
    	let t27;
    	let input4;
    	let t28;
    	let label7;
    	let t29;
    	let textarea1;
    	let t30;
    	let label8;
    	let t31;
    	let input5;
    	let t32;
    	let button1;
    	let t34;
    	let div5;
    	let div4;
    	let h23;
    	let t36;
    	let ul1;
    	let t37;
    	let img1;
    	let img1_src_value;
    	let t38;
    	let img2;
    	let img2_src_value;
    	let t39;
    	let mounted;
    	let dispose;
    	let each_value_3 = /*categories*/ ctx[2];
    	validate_each_argument(each_value_3);
    	let each_blocks_3 = [];

    	for (let i = 0; i < each_value_3.length; i += 1) {
    		each_blocks_3[i] = create_each_block_3(get_each_context_3(ctx, each_value_3, i));
    	}

    	let each_value_2 = /*categories*/ ctx[2];
    	validate_each_argument(each_value_2);
    	let each_blocks_2 = [];

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		each_blocks_2[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
    	}

    	let each_value_1 = /*menuItems*/ ctx[0].filter(/*func*/ ctx[28]);
    	validate_each_argument(each_value_1);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	let if_block0 = /*selectedCategory*/ ctx[3] != '' && create_if_block_2(ctx);
    	let if_block1 = /*selectedItemId*/ ctx[4] && create_if_block_1(ctx);
    	let each_value = /*categories*/ ctx[2];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	let if_block2 = /*selectedCategoryId*/ ctx[7] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			div7 = element("div");
    			div6 = element("div");
    			h1 = element("h1");
    			h1.textContent = "Admin Menu Page";
    			t1 = space();
    			div1 = element("div");
    			h20 = element("h2");
    			h20.textContent = "Add New Item";
    			t3 = space();
    			form0 = element("form");
    			label0 = element("label");
    			t4 = text("Category:\n                    ");
    			select0 = element("select");

    			for (let i = 0; i < each_blocks_3.length; i += 1) {
    				each_blocks_3[i].c();
    			}

    			t5 = space();
    			label1 = element("label");
    			t6 = text("Name:\n                    ");
    			input0 = element("input");
    			t7 = space();
    			label2 = element("label");
    			t8 = text("Description:\n                    ");
    			textarea0 = element("textarea");
    			t9 = space();
    			label3 = element("label");
    			t10 = text("Price:\n                    ");
    			input1 = element("input");
    			t11 = space();
    			label4 = element("label");
    			t12 = text("Available:\n                    ");
    			input2 = element("input");
    			t13 = space();
    			label5 = element("label");
    			t14 = text("Image:\n                    ");
    			div0 = element("div");
    			img0 = element("img");
    			t15 = space();
    			input3 = element("input");
    			t16 = space();
    			button0 = element("button");
    			button0.textContent = "Apply";
    			t18 = space();
    			div2 = element("div");
    			h21 = element("h2");
    			h21.textContent = "Filter by Category";
    			t20 = space();
    			select1 = element("select");

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				each_blocks_2[i].c();
    			}

    			t21 = space();
    			ul0 = element("ul");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t22 = space();
    			if (if_block0) if_block0.c();
    			t23 = space();
    			if (if_block1) if_block1.c();
    			t24 = space();
    			div3 = element("div");
    			h22 = element("h2");
    			h22.textContent = "Add New Category";
    			t26 = space();
    			form1 = element("form");
    			label6 = element("label");
    			t27 = text("Name:\n                    ");
    			input4 = element("input");
    			t28 = space();
    			label7 = element("label");
    			t29 = text("Description:\n                    ");
    			textarea1 = element("textarea");
    			t30 = space();
    			label8 = element("label");
    			t31 = text("Icon:\n                    ");
    			input5 = element("input");
    			t32 = space();
    			button1 = element("button");
    			button1.textContent = "Add Category";
    			t34 = space();
    			div5 = element("div");
    			div4 = element("div");
    			h23 = element("h2");
    			h23.textContent = "Select Category";
    			t36 = space();
    			ul1 = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t37 = space();
    			img1 = element("img");
    			t38 = space();
    			img2 = element("img");
    			t39 = space();
    			if (if_block2) if_block2.c();
    			add_location(h1, file$2, 512, 12, 16741);
    			add_location(h20, file$2, 516, 12, 16880);
    			attr_dev(select0, "class", "svelte-3pa71");
    			if (/*newItem*/ ctx[1].category === void 0) add_render_callback(() => /*select0_change_handler*/ ctx[21].call(select0));
    			add_location(select0, file$2, 520, 20, 17033);
    			attr_dev(label0, "class", "svelte-3pa71");
    			add_location(label0, file$2, 518, 16, 16975);
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "class", "svelte-3pa71");
    			add_location(input0, file$2, 528, 20, 17367);
    			attr_dev(label1, "class", "svelte-3pa71");
    			add_location(label1, file$2, 526, 16, 17313);
    			attr_dev(textarea0, "rows", "3");
    			attr_dev(textarea0, "class", "svelte-3pa71");
    			add_location(textarea0, file$2, 532, 20, 17515);
    			attr_dev(label2, "class", "svelte-3pa71");
    			add_location(label2, file$2, 530, 16, 17454);
    			attr_dev(input1, "type", "number");
    			attr_dev(input1, "step", "0.01");
    			attr_dev(input1, "class", "svelte-3pa71");
    			add_location(input1, file$2, 536, 20, 17675);
    			attr_dev(label3, "class", "svelte-3pa71");
    			add_location(label3, file$2, 534, 16, 17620);
    			attr_dev(input2, "type", "checkbox");
    			attr_dev(input2, "class", "svelte-3pa71");
    			add_location(input2, file$2, 540, 20, 17836);
    			attr_dev(label4, "class", "svelte-3pa71");
    			add_location(label4, file$2, 538, 16, 17777);
    			if (!src_url_equal(img0.src, img0_src_value = /*newItem*/ ctx[1].imageUrl)) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "alt", "Selected Item Image");
    			attr_dev(img0, "class", "svelte-3pa71");
    			add_location(img0, file$2, 545, 24, 18043);
    			attr_dev(div0, "class", "image-container svelte-3pa71");
    			add_location(div0, file$2, 544, 20, 17989);
    			attr_dev(input3, "type", "file");
    			attr_dev(input3, "accept", "image/*");
    			attr_dev(input3, "name", "image");
    			attr_dev(input3, "class", "svelte-3pa71");
    			add_location(input3, file$2, 547, 20, 18147);
    			attr_dev(label5, "class", "svelte-3pa71");
    			add_location(label5, file$2, 542, 16, 17934);
    			attr_dev(button0, "type", "submit");
    			attr_dev(button0, "class", "svelte-3pa71");
    			add_location(button0, file$2, 549, 16, 18268);
    			add_location(form0, file$2, 517, 12, 16914);
    			attr_dev(div1, "class", "add-item-card svelte-3pa71");
    			add_location(div1, file$2, 515, 12, 16840);
    			add_location(h21, file$2, 567, 16, 18979);
    			if (/*selectedCategory*/ ctx[3] === void 0) add_render_callback(() => /*select1_change_handler*/ ctx[27].call(select1));
    			add_location(select1, file$2, 568, 16, 19023);
    			attr_dev(ul0, "class", "add-item-list svelte-3pa71");
    			add_location(ul0, file$2, 575, 16, 19394);
    			attr_dev(div2, "class", "add-item-list svelte-3pa71");
    			add_location(div2, file$2, 566, 12, 18935);
    			add_location(h22, file$2, 635, 12, 22112);
    			attr_dev(input4, "type", "text");
    			attr_dev(input4, "class", "svelte-3pa71");
    			add_location(input4, file$2, 639, 20, 22269);
    			attr_dev(label6, "class", "svelte-3pa71");
    			add_location(label6, file$2, 637, 16, 22215);
    			attr_dev(textarea1, "rows", "3");
    			attr_dev(textarea1, "class", "svelte-3pa71");
    			add_location(textarea1, file$2, 643, 20, 22421);
    			attr_dev(label7, "class", "svelte-3pa71");
    			add_location(label7, file$2, 641, 16, 22360);
    			attr_dev(input5, "type", "file");
    			attr_dev(input5, "accept", "image/*");
    			attr_dev(input5, "name", "icon");
    			attr_dev(input5, "class", "svelte-3pa71");
    			add_location(input5, file$2, 647, 20, 22584);
    			attr_dev(label8, "class", "svelte-3pa71");
    			add_location(label8, file$2, 645, 16, 22530);
    			attr_dev(button1, "type", "submit");
    			attr_dev(button1, "class", "svelte-3pa71");
    			add_location(button1, file$2, 649, 16, 22711);
    			add_location(form1, file$2, 636, 12, 22150);
    			attr_dev(div3, "class", "add-item-card svelte-3pa71");
    			add_location(div3, file$2, 634, 8, 22072);
    			add_location(h23, file$2, 656, 12, 22966);
    			attr_dev(ul1, "class", "add-item-list svelte-3pa71");
    			add_location(ul1, file$2, 657, 12, 23003);
    			if (!src_url_equal(img1.src, img1_src_value = "/up.png")) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "alt", "Logo");
    			attr_dev(img1, "class", "logo svelte-3pa71");
    			add_location(img1, file$2, 666, 12, 23519);
    			if (!src_url_equal(img2.src, img2_src_value = "/down.png")) attr_dev(img2, "src", img2_src_value);
    			attr_dev(img2, "alt", "Logo");
    			attr_dev(img2, "class", "logo svelte-3pa71");
    			add_location(img2, file$2, 667, 12, 23663);
    			attr_dev(div4, "class", "filter-category svelte-3pa71");
    			add_location(div4, file$2, 654, 8, 22872);
    			attr_dev(div5, "class", "filter-category-section svelte-3pa71");
    			add_location(div5, file$2, 653, 4, 22826);
    			attr_dev(div6, "class", "menu-page");
    			add_location(div6, file$2, 511, 8, 16705);
    			attr_dev(div7, "class", "container svelte-3pa71");
    			add_location(div7, file$2, 510, 4, 16673);
    		},
    		l: function claim(nodes) {
    			throw new Error_1("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div7, anchor);
    			append_dev(div7, div6);
    			append_dev(div6, h1);
    			append_dev(div6, t1);
    			append_dev(div6, div1);
    			append_dev(div1, h20);
    			append_dev(div1, t3);
    			append_dev(div1, form0);
    			append_dev(form0, label0);
    			append_dev(label0, t4);
    			append_dev(label0, select0);

    			for (let i = 0; i < each_blocks_3.length; i += 1) {
    				if (each_blocks_3[i]) {
    					each_blocks_3[i].m(select0, null);
    				}
    			}

    			select_option(select0, /*newItem*/ ctx[1].category, true);
    			append_dev(form0, t5);
    			append_dev(form0, label1);
    			append_dev(label1, t6);
    			append_dev(label1, input0);
    			set_input_value(input0, /*newItem*/ ctx[1].name);
    			append_dev(form0, t7);
    			append_dev(form0, label2);
    			append_dev(label2, t8);
    			append_dev(label2, textarea0);
    			set_input_value(textarea0, /*newItem*/ ctx[1].description);
    			append_dev(form0, t9);
    			append_dev(form0, label3);
    			append_dev(label3, t10);
    			append_dev(label3, input1);
    			set_input_value(input1, /*newItem*/ ctx[1].price);
    			append_dev(form0, t11);
    			append_dev(form0, label4);
    			append_dev(label4, t12);
    			append_dev(label4, input2);
    			input2.checked = /*newItem*/ ctx[1].available;
    			append_dev(form0, t13);
    			append_dev(form0, label5);
    			append_dev(label5, t14);
    			append_dev(label5, div0);
    			append_dev(div0, img0);
    			append_dev(label5, t15);
    			append_dev(label5, input3);
    			append_dev(form0, t16);
    			append_dev(form0, button0);
    			append_dev(div6, t18);
    			append_dev(div6, div2);
    			append_dev(div2, h21);
    			append_dev(div2, t20);
    			append_dev(div2, select1);

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				if (each_blocks_2[i]) {
    					each_blocks_2[i].m(select1, null);
    				}
    			}

    			select_option(select1, /*selectedCategory*/ ctx[3], true);
    			append_dev(div2, t21);
    			append_dev(div2, ul0);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				if (each_blocks_1[i]) {
    					each_blocks_1[i].m(ul0, null);
    				}
    			}

    			append_dev(div2, t22);
    			if (if_block0) if_block0.m(div2, null);
    			append_dev(div6, t23);
    			if (if_block1) if_block1.m(div6, null);
    			append_dev(div6, t24);
    			append_dev(div6, div3);
    			append_dev(div3, h22);
    			append_dev(div3, t26);
    			append_dev(div3, form1);
    			append_dev(form1, label6);
    			append_dev(label6, t27);
    			append_dev(label6, input4);
    			set_input_value(input4, /*newCategory*/ ctx[6].name);
    			append_dev(form1, t28);
    			append_dev(form1, label7);
    			append_dev(label7, t29);
    			append_dev(label7, textarea1);
    			set_input_value(textarea1, /*newCategory*/ ctx[6].description);
    			append_dev(form1, t30);
    			append_dev(form1, label8);
    			append_dev(label8, t31);
    			append_dev(label8, input5);
    			append_dev(form1, t32);
    			append_dev(form1, button1);
    			append_dev(div6, t34);
    			append_dev(div6, div5);
    			append_dev(div5, div4);
    			append_dev(div4, h23);
    			append_dev(div4, t36);
    			append_dev(div4, ul1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(ul1, null);
    				}
    			}

    			append_dev(div4, t37);
    			append_dev(div4, img1);
    			append_dev(div4, t38);
    			append_dev(div4, img2);
    			append_dev(div6, t39);
    			if (if_block2) if_block2.m(div6, null);

    			if (!mounted) {
    				dispose = [
    					listen_dev(select0, "change", /*select0_change_handler*/ ctx[21]),
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[22]),
    					listen_dev(textarea0, "input", /*textarea0_input_handler*/ ctx[23]),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[24]),
    					listen_dev(input2, "change", /*input2_change_handler*/ ctx[25]),
    					listen_dev(input3, "change", /*handleImageUpload*/ ctx[13], false, false, false, false),
    					listen_dev(form0, "submit", prevent_default(/*addNewItem*/ ctx[9]), false, true, false, false),
    					listen_dev(select1, "change", /*select1_change_handler*/ ctx[27]),
    					listen_dev(input4, "input", /*input4_input_handler*/ ctx[34]),
    					listen_dev(textarea1, "input", /*textarea1_input_handler*/ ctx[35]),
    					listen_dev(input5, "change", /*handleCategoryIconUpload*/ ctx[12], false, false, false, false),
    					listen_dev(form1, "submit", prevent_default(/*addNewCategory*/ ctx[10]), false, true, false, false),
    					listen_dev(
    						img1,
    						"click",
    						function () {
    							if (is_function(/*updateCategoryOrder*/ ctx[19](/*selectedCategoryItem*/ ctx[8]._id, /*selectedCategoryItem*/ ctx[8].order - 1))) /*updateCategoryOrder*/ ctx[19](/*selectedCategoryItem*/ ctx[8]._id, /*selectedCategoryItem*/ ctx[8].order - 1).apply(this, arguments);
    						},
    						false,
    						false,
    						false,
    						false
    					),
    					listen_dev(
    						img2,
    						"click",
    						function () {
    							if (is_function(/*updateCategoryOrder*/ ctx[19](/*selectedCategoryItem*/ ctx[8]._id, /*selectedCategoryItem*/ ctx[8].order + 1))) /*updateCategoryOrder*/ ctx[19](/*selectedCategoryItem*/ ctx[8]._id, /*selectedCategoryItem*/ ctx[8].order + 1).apply(this, arguments);
    						},
    						false,
    						false,
    						false,
    						false
    					)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty[0] & /*categories*/ 4) {
    				each_value_3 = /*categories*/ ctx[2];
    				validate_each_argument(each_value_3);
    				let i;

    				for (i = 0; i < each_value_3.length; i += 1) {
    					const child_ctx = get_each_context_3(ctx, each_value_3, i);

    					if (each_blocks_3[i]) {
    						each_blocks_3[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_3[i] = create_each_block_3(child_ctx);
    						each_blocks_3[i].c();
    						each_blocks_3[i].m(select0, null);
    					}
    				}

    				for (; i < each_blocks_3.length; i += 1) {
    					each_blocks_3[i].d(1);
    				}

    				each_blocks_3.length = each_value_3.length;
    			}

    			if (dirty[0] & /*newItem, categories*/ 6) {
    				select_option(select0, /*newItem*/ ctx[1].category);
    			}

    			if (dirty[0] & /*newItem, categories*/ 6 && input0.value !== /*newItem*/ ctx[1].name) {
    				set_input_value(input0, /*newItem*/ ctx[1].name);
    			}

    			if (dirty[0] & /*newItem, categories*/ 6) {
    				set_input_value(textarea0, /*newItem*/ ctx[1].description);
    			}

    			if (dirty[0] & /*newItem, categories*/ 6 && to_number(input1.value) !== /*newItem*/ ctx[1].price) {
    				set_input_value(input1, /*newItem*/ ctx[1].price);
    			}

    			if (dirty[0] & /*newItem, categories*/ 6) {
    				input2.checked = /*newItem*/ ctx[1].available;
    			}

    			if (dirty[0] & /*newItem, categories*/ 6 && !src_url_equal(img0.src, img0_src_value = /*newItem*/ ctx[1].imageUrl)) {
    				attr_dev(img0, "src", img0_src_value);
    			}

    			if (dirty[0] & /*categories, selectedCategory*/ 12) {
    				each_value_2 = /*categories*/ ctx[2];
    				validate_each_argument(each_value_2);
    				let i;

    				for (i = 0; i < each_value_2.length; i += 1) {
    					const child_ctx = get_each_context_2(ctx, each_value_2, i);

    					if (each_blocks_2[i]) {
    						each_blocks_2[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_2[i] = create_each_block_2(child_ctx);
    						each_blocks_2[i].c();
    						each_blocks_2[i].m(select1, null);
    					}
    				}

    				for (; i < each_blocks_2.length; i += 1) {
    					each_blocks_2[i].d(1);
    				}

    				each_blocks_2.length = each_value_2.length;
    			}

    			if (dirty[0] & /*selectedCategory, categories*/ 12) {
    				select_option(select1, /*selectedCategory*/ ctx[3]);
    			}

    			if (dirty[0] & /*menuItems, selectedCategory, selectedItemId, selectItemForModification*/ 32793) {
    				each_value_1 = /*menuItems*/ ctx[0].filter(/*func*/ ctx[28]);
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_1(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(ul0, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_1.length;
    			}

    			if (/*selectedCategory*/ ctx[3] != '') {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_2(ctx);
    					if_block0.c();
    					if_block0.m(div2, null);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*selectedItemId*/ ctx[4]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block_1(ctx);
    					if_block1.c();
    					if_block1.m(div6, t24);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (dirty[0] & /*newCategory*/ 64 && input4.value !== /*newCategory*/ ctx[6].name) {
    				set_input_value(input4, /*newCategory*/ ctx[6].name);
    			}

    			if (dirty[0] & /*newCategory*/ 64) {
    				set_input_value(textarea1, /*newCategory*/ ctx[6].description);
    			}

    			if (dirty[0] & /*categories, selectedCategoryId, selectCategoryForModification*/ 65668) {
    				each_value = /*categories*/ ctx[2];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ul1, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (/*selectedCategoryId*/ ctx[7]) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);
    				} else {
    					if_block2 = create_if_block(ctx);
    					if_block2.c();
    					if_block2.m(div6, null);
    				}
    			} else if (if_block2) {
    				if_block2.d(1);
    				if_block2 = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div7);
    			destroy_each(each_blocks_3, detaching);
    			destroy_each(each_blocks_2, detaching);
    			destroy_each(each_blocks_1, detaching);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			destroy_each(each_blocks, detaching);
    			if (if_block2) if_block2.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function logout() {
    	localStorage.removeItem('token'); // Remove token from localStorage
    	window.location.href = '/login'; // Redirect to login page
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('AdminPanel', slots, []);
    	let menuItems = [];
    	let newItem = {}; // Object to store new item data
    	let categories = []; // Array to store unique categories
    	let selectedCategory = ''; // Variable to store the selected category
    	let selectedItemId = ''; // Variable to store the ID of the selected item for modification
    	let selectedItem = {}; // Object to store the selected item for modification
    	let imageFile; // Variable to store the selected image file
    	let newCategory = {}; // Object to store new category data
    	let selectedCategoryId = ''; // Variable to store the ID of the selected category for modification
    	let selectedCategoryItem = {}; // Object to store the selected category for modification
    	let categoryIconFile; // Variable to store the selected category icon file

    	// Define session timeout duration (20 minutes)
    	const SESSION_TIMEOUT = 20 * 60 * 1000; // in milliseconds

    	let timeoutId; // Variable to store the timeout ID

    	// Reset the session timeout on user activity
    	function resetSessionTimeout() {
    		clearTimeout(timeoutId); // Clear previous timeout
    		timeoutId = setTimeout(logout, SESSION_TIMEOUT); // Set new timeout
    	}

    	// Check if the user is authenticated
    	const isAuthenticated = () => {
    		const token = localStorage.getItem('token'); // Assuming token is stored in localStorage
    		return !!token;
    	};

    	// Redirect to login page if not authenticated
    	onMount(() => {
    		if (!isAuthenticated()) {
    			window.location.href = '/login'; // Redirect to login page
    		} else {
    			// Start the session timeout countdown
    			resetSessionTimeout();

    			// Reset session timeout on user activity
    			window.addEventListener('mousemove', resetSessionTimeout);

    			window.addEventListener('mousedown', resetSessionTimeout);
    			window.addEventListener('keypress', resetSessionTimeout);
    			fetchMenuItems(); // Fetch menu items if authenticated
    			fetchCategories(); // Fetch categories on mount
    		}
    	});

    	async function fetchMenuItems() {
    		try {
    			const response = await fetch('https://' + MY_IP + ':5000/api/menu');

    			if (!response.ok) {
    				throw new Error('Failed to fetch menu items');
    			}

    			$$invalidate(0, menuItems = await response.json());
    			$$invalidate(0, menuItems = menuItems.slice().sort((a, b) => a.order - b.order));
    		} catch(error) {
    			console.error('Error fetching menu items:', error);
    		}
    	}

    	async function fetchCategories() {
    		try {
    			const response = await fetch('https://' + MY_IP + ':5000/api/categories');

    			if (!response.ok) {
    				throw new Error('Failed to fetch categories');
    			}

    			$$invalidate(2, categories = await response.json());
    			$$invalidate(2, categories = categories.slice().sort((a, b) => a.order - b.order));
    		} catch(error) {
    			console.error('Error fetching categories:', error);
    		}
    	}

    	// Function to handle adding new item
    	function addNewItem() {
    		const formData = new FormData();
    		formData.append('data', JSON.stringify(newItem));
    		formData.append('image', imageFile);

    		// Send a request to the server to add the new item
    		fetch('https://' + MY_IP + ':5000/api/menu/add', {
    			method: 'POST',
    			headers: { 'Content-Type': 'application/json' },
    			body: JSON.stringify(newItem)
    		}).then(response => {
    			if (!response.ok) {
    				throw new Error('Failed to add new item');
    			}

    			// Refresh the menu items after adding the new item
    			fetchMenuItems();
    		}).catch(error => {
    			console.error('Error adding new item:', error);
    		});
    	}

    	// Function to handle adding new category
    	function addNewCategory() {
    		const formData = new FormData();
    		formData.append('data', JSON.stringify(newCategory));
    		formData.append('icon', categoryIconFile);

    		// Send a request to the server to add the new category
    		fetch('https://' + MY_IP + ':5000/api/categories', {
    			method: 'POST',
    			headers: { 'Content-Type': 'application/json' },
    			body: JSON.stringify(newCategory)
    		}).then(response => {
    			if (!response.ok) {
    				throw new Error('Failed to add new category');
    			}

    			// Refresh the categories after adding the new category
    			fetchCategories();
    		}).catch(error => {
    			console.error('Error adding new category:', error);
    		});
    	}

    	// Function to handle updating the selected category
    	function updateSelectedCategory() {
    		const formData = new FormData();
    		formData.append('data', JSON.stringify(selectedCategoryItem));
    		formData.append('icon', categoryIconFile);

    		// Send a request to the server to update the selected category
    		fetch(`https://${MY_IP}:5000/api/categories/${selectedCategoryItem._id}`, {
    			method: 'PUT',
    			headers: { 'Content-Type': 'application/json' },
    			body: JSON.stringify(selectedCategoryItem)
    		}).then(response => {
    			if (!response.ok) {
    				throw new Error('Failed to update category');
    			}

    			// Refresh the categories after updating the category
    			fetchCategories();
    		}).catch(error => {
    			console.error('Error updating category:', error);
    		});
    	}

    	// Function to handle category icon selection
    	function handleCategoryIconUpload(event) {
    		categoryIconFile = event.target.files[0];
    		const formData = new FormData();
    		formData.append('icon', categoryIconFile);

    		fetch('https://' + MY_IP + ':5000/api/categories/upload-icon', { method: 'POST', body: formData }).then(response => response.json()).then(data => {
    			if (!data.iconUrl) {
    				throw new Error('Icon URL not found in response');
    			}

    			$$invalidate(6, newCategory.iconUrl = data.iconUrl, newCategory); // Update newCategory's iconUrl
    			$$invalidate(8, selectedCategoryItem.iconUrl = data.iconUrl, selectedCategoryItem); // Update selectedCategoryItem's iconUrl
    		}).catch(error => {
    			console.error('Error uploading category icon:', error);
    		});
    	}

    	// Function to handle image selection for menu items
    	function handleImageUpload(event) {
    		const file = event.target.files[0];
    		const formData = new FormData();
    		imageFile = event.target.files[0];
    		formData.append('image', file);

    		fetch('https://' + MY_IP + ':5000/api/menu/upload', { method: 'POST', body: formData }).then(response => response.json()).then(data => {
    			if (!data.imageUrl) {
    				throw new Error('Image URL not found in response');
    			}

    			$$invalidate(1, newItem.imageUrl = data.imageUrl, newItem); // Update newItem's imageUrl
    			$$invalidate(5, selectedItem.imageUrl = data.imageUrl, selectedItem); // Update selectedItem's imageUrl
    		}).catch(error => {
    			console.error('Error uploading image:', error);
    		});
    	}

    	// Function to handle deleting the selected category
    	function deleteSelectedCategory() {
    		if (confirm("Are you sure you want to delete this category?")) {
    			// Send a request to the server to delete the selected category
    			fetch(`https://${MY_IP}:5000/api/categories/${selectedCategoryItem._id}`, { method: 'DELETE' }).then(response => {
    				if (!response.ok) {
    					throw new Error('Failed to delete category');
    				}

    				// Refresh the categories after deleting the category
    				fetchCategories();

    				// Clear selected category details
    				$$invalidate(7, selectedCategoryId = '');

    				$$invalidate(8, selectedCategoryItem = {});
    			}).catch(error => {
    				console.error('Error deleting category:', error);
    			});
    		}
    	}

    	function selectItemForModification(itemId) {
    		$$invalidate(4, selectedItemId = itemId);
    		$$invalidate(5, selectedItem = menuItems.find(item => item._id === itemId));
    	}

    	// Function to handle selecting a category for modification
    	function selectCategoryForModification(categoryId) {
    		$$invalidate(7, selectedCategoryId = categoryId);
    		$$invalidate(8, selectedCategoryItem = categories.find(category => category._id === categoryId));
    	}

    	function deleteSelectedItem() {
    		if (confirm("Are you sure you want to delete this item?")) {
    			fetch(`https://${MY_IP}:5000/api/menu/${selectedItem._id}`, { method: 'DELETE' }).then(response => {
    				if (!response.ok) {
    					throw new Error('Failed to delete item');
    				}

    				fetchMenuItems();
    				$$invalidate(4, selectedItemId = '');
    				$$invalidate(5, selectedItem = {});
    			}).catch(error => {
    				console.error('Error deleting item:', error);
    			});
    		}
    	}

    	function updateSelectedItem() {
    		const formData = new FormData();
    		formData.append('data', JSON.stringify(selectedItem));
    		formData.append('image', imageFile);

    		fetch(`https://${MY_IP}:5000/api/menu/${selectedItem._id}`, {
    			method: 'PUT',
    			headers: { 'Content-Type': 'application/json' },
    			body: JSON.stringify(selectedItem)
    		}).then(response => {
    			if (!response.ok) {
    				throw new Error('Failed to update item');
    			}

    			fetchMenuItems();
    		}).catch(error => {
    			console.error('Error updating item:', error);
    		});
    	}

    	// Function to update the order of categories in the database
    	async function updateCategoryOrder(catID, newIndex) {
    		try {
    			const response = await fetch(`https://${MY_IP}:5000/api/categories/${catID}/reorder`, {
    				method: 'PUT',
    				headers: { 'Content-Type': 'application/json' },
    				body: JSON.stringify({ newIndex })
    			});

    			if (!response.ok) {
    				throw new Error('Failed to update category order in the database');
    			}

    			await fetchCategories();
    			selectCategoryForModification(catID);
    		} catch(error) {
    			console.error('Error updating category order:', error);
    		}
    	}

    	async function updateItemOrder(itemID, newIndex) {
    		try {
    			const response = await fetch(`https://${MY_IP}:5000/api/menu/${itemID}/reorder`, {
    				method: 'PUT',
    				headers: { 'Content-Type': 'application/json' },
    				body: JSON.stringify({ newIndex })
    			});

    			if (!response.ok) {
    				throw new Error('Failed to update category order in the database');
    			}

    			await fetchMenuItems();
    			selectItemForModification(itemID);
    		} catch(error) {
    			console.error('Error updating category order:', error);
    		}
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$1.warn(`<AdminPanel> was created with unknown prop '${key}'`);
    	});

    	function select0_change_handler() {
    		newItem.category = select_value(this);
    		$$invalidate(1, newItem);
    		$$invalidate(2, categories);
    	}

    	function input0_input_handler() {
    		newItem.name = this.value;
    		$$invalidate(1, newItem);
    		$$invalidate(2, categories);
    	}

    	function textarea0_input_handler() {
    		newItem.description = this.value;
    		$$invalidate(1, newItem);
    		$$invalidate(2, categories);
    	}

    	function input1_input_handler() {
    		newItem.price = to_number(this.value);
    		$$invalidate(1, newItem);
    		$$invalidate(2, categories);
    	}

    	function input2_change_handler() {
    		newItem.available = this.checked;
    		$$invalidate(1, newItem);
    		$$invalidate(2, categories);
    	}

    	const click_handler = category => $$invalidate(3, selectedCategory = categories.find(cat => cat.name === category.name));

    	function select1_change_handler() {
    		selectedCategory = select_value(this);
    		$$invalidate(3, selectedCategory);
    		$$invalidate(2, categories);
    	}

    	const func = item => item.category === selectedCategory.name || selectedCategory === '';
    	const click_handler_1 = item => selectItemForModification(item._id);

    	function input0_input_handler_1() {
    		selectedItem.name = this.value;
    		$$invalidate(5, selectedItem);
    	}

    	function textarea_input_handler() {
    		selectedItem.description = this.value;
    		$$invalidate(5, selectedItem);
    	}

    	function input1_input_handler_1() {
    		selectedItem.price = to_number(this.value);
    		$$invalidate(5, selectedItem);
    	}

    	function input2_change_handler_1() {
    		selectedItem.available = this.checked;
    		$$invalidate(5, selectedItem);
    	}

    	function input4_input_handler() {
    		newCategory.name = this.value;
    		$$invalidate(6, newCategory);
    	}

    	function textarea1_input_handler() {
    		newCategory.description = this.value;
    		$$invalidate(6, newCategory);
    	}

    	const change_handler = category => selectCategoryForModification(category._id);

    	function input0_input_handler_2() {
    		selectedCategoryItem.name = this.value;
    		$$invalidate(8, selectedCategoryItem);
    	}

    	function textarea_input_handler_1() {
    		selectedCategoryItem.description = this.value;
    		$$invalidate(8, selectedCategoryItem);
    	}

    	$$self.$capture_state = () => ({
    		onMount,
    		fly,
    		MY_IP,
    		menuItems,
    		newItem,
    		categories,
    		selectedCategory,
    		selectedItemId,
    		selectedItem,
    		imageFile,
    		newCategory,
    		selectedCategoryId,
    		selectedCategoryItem,
    		categoryIconFile,
    		SESSION_TIMEOUT,
    		timeoutId,
    		resetSessionTimeout,
    		logout,
    		isAuthenticated,
    		fetchMenuItems,
    		fetchCategories,
    		addNewItem,
    		addNewCategory,
    		updateSelectedCategory,
    		handleCategoryIconUpload,
    		handleImageUpload,
    		deleteSelectedCategory,
    		selectItemForModification,
    		selectCategoryForModification,
    		deleteSelectedItem,
    		updateSelectedItem,
    		updateCategoryOrder,
    		updateItemOrder
    	});

    	$$self.$inject_state = $$props => {
    		if ('menuItems' in $$props) $$invalidate(0, menuItems = $$props.menuItems);
    		if ('newItem' in $$props) $$invalidate(1, newItem = $$props.newItem);
    		if ('categories' in $$props) $$invalidate(2, categories = $$props.categories);
    		if ('selectedCategory' in $$props) $$invalidate(3, selectedCategory = $$props.selectedCategory);
    		if ('selectedItemId' in $$props) $$invalidate(4, selectedItemId = $$props.selectedItemId);
    		if ('selectedItem' in $$props) $$invalidate(5, selectedItem = $$props.selectedItem);
    		if ('imageFile' in $$props) imageFile = $$props.imageFile;
    		if ('newCategory' in $$props) $$invalidate(6, newCategory = $$props.newCategory);
    		if ('selectedCategoryId' in $$props) $$invalidate(7, selectedCategoryId = $$props.selectedCategoryId);
    		if ('selectedCategoryItem' in $$props) $$invalidate(8, selectedCategoryItem = $$props.selectedCategoryItem);
    		if ('categoryIconFile' in $$props) categoryIconFile = $$props.categoryIconFile;
    		if ('timeoutId' in $$props) timeoutId = $$props.timeoutId;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		menuItems,
    		newItem,
    		categories,
    		selectedCategory,
    		selectedItemId,
    		selectedItem,
    		newCategory,
    		selectedCategoryId,
    		selectedCategoryItem,
    		addNewItem,
    		addNewCategory,
    		updateSelectedCategory,
    		handleCategoryIconUpload,
    		handleImageUpload,
    		deleteSelectedCategory,
    		selectItemForModification,
    		selectCategoryForModification,
    		deleteSelectedItem,
    		updateSelectedItem,
    		updateCategoryOrder,
    		updateItemOrder,
    		select0_change_handler,
    		input0_input_handler,
    		textarea0_input_handler,
    		input1_input_handler,
    		input2_change_handler,
    		click_handler,
    		select1_change_handler,
    		func,
    		click_handler_1,
    		input0_input_handler_1,
    		textarea_input_handler,
    		input1_input_handler_1,
    		input2_change_handler_1,
    		input4_input_handler,
    		textarea1_input_handler,
    		change_handler,
    		input0_input_handler_2,
    		textarea_input_handler_1
    	];
    }

    class AdminPanel extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {}, null, [-1, -1]);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "AdminPanel",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src/components/LoginPage.svelte generated by Svelte v3.59.2 */

    const { console: console_1 } = globals;
    const file$1 = "src/components/LoginPage.svelte";

    function create_fragment$1(ctx) {
    	let h1;
    	let t1;
    	let form;
    	let label0;
    	let t2;
    	let input0;
    	let t3;
    	let label1;
    	let t4;
    	let input1;
    	let t5;
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Login";
    			t1 = space();
    			form = element("form");
    			label0 = element("label");
    			t2 = text("Username:\n        ");
    			input0 = element("input");
    			t3 = space();
    			label1 = element("label");
    			t4 = text("Password:\n        ");
    			input1 = element("input");
    			t5 = space();
    			button = element("button");
    			button.textContent = "Login";
    			add_location(h1, file$1, 35, 0, 1094);
    			attr_dev(input0, "type", "text");
    			add_location(input0, file$1, 40, 8, 1180);
    			add_location(label0, file$1, 38, 4, 1146);
    			attr_dev(input1, "type", "password");
    			add_location(input1, file$1, 44, 8, 1283);
    			add_location(label1, file$1, 42, 4, 1249);
    			attr_dev(button, "type", "submit");
    			add_location(button, file$1, 46, 4, 1356);
    			add_location(form, file$1, 37, 0, 1110);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, form, anchor);
    			append_dev(form, label0);
    			append_dev(label0, t2);
    			append_dev(label0, input0);
    			set_input_value(input0, /*$formData*/ ctx[0].username);
    			append_dev(form, t3);
    			append_dev(form, label1);
    			append_dev(label1, t4);
    			append_dev(label1, input1);
    			set_input_value(input1, /*$formData*/ ctx[0].password);
    			append_dev(form, t5);
    			append_dev(form, button);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[3]),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[4]),
    					listen_dev(form, "submit", /*handleSubmit*/ ctx[2], false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$formData*/ 1 && input0.value !== /*$formData*/ ctx[0].username) {
    				set_input_value(input0, /*$formData*/ ctx[0].username);
    			}

    			if (dirty & /*$formData*/ 1 && input1.value !== /*$formData*/ ctx[0].password) {
    				set_input_value(input1, /*$formData*/ ctx[0].password);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(form);
    			mounted = false;
    			run_all(dispose);
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
    	let $formData;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('LoginPage', slots, []);
    	const formData = writable({ username: '', password: '' });
    	validate_store(formData, 'formData');
    	component_subscribe($$self, formData, value => $$invalidate(0, $formData = value));

    	// Function to handle form submission
    	async function handleSubmit(event) {
    		event.preventDefault();

    		try {
    			const response = await fetch('https://' + MY_IP + ':5000/api/admin/login', {
    				method: 'POST',
    				headers: { 'Content-Type': 'application/json' },
    				body: JSON.stringify($formData)
    			});

    			if (response.ok) {
    				const { token } = await response.json();
    				localStorage.setItem('token', token);
    				window.location.href = '/admin'; // Redirect to admin page
    			} else {
    				// Handle invalid credentials
    				console.error('Invalid username or password');
    			}
    		} catch(error) {
    			console.error('Error:', error);
    		}
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<LoginPage> was created with unknown prop '${key}'`);
    	});

    	function input0_input_handler() {
    		$formData.username = this.value;
    		formData.set($formData);
    	}

    	function input1_input_handler() {
    		$formData.password = this.value;
    		formData.set($formData);
    	}

    	$$self.$capture_state = () => ({
    		onMount,
    		writable,
    		MY_IP,
    		formData,
    		handleSubmit,
    		$formData
    	});

    	return [$formData, formData, handleSubmit, input0_input_handler, input1_input_handler];
    }

    class LoginPage extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "LoginPage",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.59.2 */
    const file = "src/App.svelte";

    // (11:1) <Router>
    function create_default_slot(ctx) {
    	let route0;
    	let t0;
    	let route1;
    	let t1;
    	let route2;
    	let t2;
    	let route3;
    	let current;

    	route0 = new Route({
    			props: { path: "/", component: LandingPage },
    			$$inline: true
    		});

    	route1 = new Route({
    			props: { path: "/menu", component: Menu },
    			$$inline: true
    		});

    	route2 = new Route({
    			props: { path: "/admin", component: AdminPanel },
    			$$inline: true
    		});

    	route3 = new Route({
    			props: { path: "/login", component: LoginPage },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(route0.$$.fragment);
    			t0 = space();
    			create_component(route1.$$.fragment);
    			t1 = space();
    			create_component(route2.$$.fragment);
    			t2 = space();
    			create_component(route3.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(route0, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(route1, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(route2, target, anchor);
    			insert_dev(target, t2, anchor);
    			mount_component(route3, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(route0.$$.fragment, local);
    			transition_in(route1.$$.fragment, local);
    			transition_in(route2.$$.fragment, local);
    			transition_in(route3.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(route0.$$.fragment, local);
    			transition_out(route1.$$.fragment, local);
    			transition_out(route2.$$.fragment, local);
    			transition_out(route3.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(route0, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(route1, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(route2, detaching);
    			if (detaching) detach_dev(t2);
    			destroy_component(route3, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(11:1) <Router>",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let main;
    	let router;
    	let current;

    	router = new Router({
    			props: {
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			main = element("main");
    			create_component(router.$$.fragment);
    			attr_dev(main, "class", "svelte-1no4cmf");
    			add_location(main, file, 9, 0, 395);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			mount_component(router, main, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const router_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				router_changes.$$scope = { dirty, ctx };
    			}

    			router.$set(router_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(router.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(router.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(router);
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
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		Router,
    		Route,
    		LandingPage,
    		MenuPage: Menu,
    		AdminPage: AdminPanel,
    		Link,
    		AdminPanel,
    		LoginPage
    	});

    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
