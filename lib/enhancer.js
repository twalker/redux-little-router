'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createHistoryListener = exports.createStoreSubscriber = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _queryString = require('query-string');

var _queryString2 = _interopRequireDefault(_queryString);

var _types = require('./types');

var _actions = require('./actions');

var _matchCache = require('./util/match-cache');

var _matchCache2 = _interopRequireDefault(_matchCache);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var createStoreSubscriber = exports.createStoreSubscriber = function createStoreSubscriber(store, createMatcher) {
  return function (currentMatcher) {
    var _store$getState$route = store.getState().router,
        routes = _store$getState$route.routes,
        pathname = _store$getState$route.pathname,
        search = _store$getState$route.search,
        hash = _store$getState$route.hash,
        _store$getState$route2 = _store$getState$route.options;
    _store$getState$route2 = _store$getState$route2 === undefined ? {} : _store$getState$route2;
    var updateRoutes = _store$getState$route2.updateRoutes;

    if (updateRoutes) {
      currentMatcher = createMatcher(routes);
      store.dispatch((0, _actions.didReplaceRoutes)());
      store.dispatch((0, _actions.replace)({ pathname: pathname, search: search, hash: hash }));
    }
    return currentMatcher;
  };
};

var createHistoryListener = exports.createHistoryListener = function createHistoryListener(store) {
  return function (currentMatcher, location, action) {
    _matchCache2.default.clear();
    var match = currentMatcher(location.pathname);
    var payload = _extends({}, location, match, {
      query: _queryString2.default.parse(location.search)
    });
    // Other actions come from the user, so they already have a
    // corresponding queued navigation action.
    if (action === "POP") {
      store.dispatch({
        type: _types.POP,
        payload: payload
      });
    }
    store.dispatch((0, _actions.locationDidChange)(payload));
  };
};

exports.default = function (_ref) {
  var history = _ref.history,
      matchRoute = _ref.matchRoute,
      createMatcher = _ref.createMatcher;
  return function (createStore) {
    return function (userReducer, initialState, enhancer) {
      var currentMatcher = matchRoute;

      var store = createStore(userReducer, initialState, enhancer);
      var storeSubscriber = createStoreSubscriber(store, createMatcher);
      var historyListener = createHistoryListener(store);

      // Replace the matcher when replacing routes
      store.subscribe(function () {
        currentMatcher = storeSubscriber(currentMatcher);
      });

      history.listen(function (location, action) {
        return historyListener(currentMatcher, location, action);
      });

      return _extends({}, store, {
        matchRoute: matchRoute
      });
    };
  };
};