define(["backbone", "elevator"], function(Backbone, elevator) {
  return Backbone.Router.extend({
    routes : {
      "" : "index"
    },
    index : function() {
      elevator.mainView.render();
    }
  });
});
