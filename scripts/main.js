require.config({
  paths: {
    "jquery": "jquery.min",
    "underscore": "../bower_components/underscore/underscore-min",
    "backbone": "../bower_components/backbone/backbone",
    "react": "../bower_components/react/react.min.js",
    "JSXTransformer": "../bower_components/react/JSXTransformer.js"
  },
  "shim" : {
    "backbone" : {
      "deps" : [
        "jquery",
        "underscore"
      ],
      "exports" : "Backbone"
    },
    "jquery" : {
      "exports" : "$"
    },
    "underscore" : {
      "exports" : "_"
    }
  }
});
require(["backbone", "router"], function(Backbone, Router) {
  new Router();
  Backbone.history.start();
});
