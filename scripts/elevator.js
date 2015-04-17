define(["backbone", "underscore"], function(Backbone, _) {
  var elevator = {};

  mainView = Backbone.View.extend({
    el: ".container",
    elevatorViews: [],
    floorViews: [],
    initialize: function() {
      elevatorModel = new ElevatorModel;
      elevatorView = new ElevatorView({model: elevatorModel});

      elevatorView.on("arrived", this.updateWaitingStatus, this);

      for (var i=5; i > 0; i--) {
        var model = new FloorModel({number: i});
        var view = new FloorView({model: model});
        this.floorViews.push(view);
      }

      this.elevatorViews.push(elevatorView);
      this.template = _.template($("#mainTemplate").html());
    },
    render: function() {
      this.$el.append(this.template);
      this.renderElevator();
      this.renderFloors();
      return this;
    },
    renderElevator: function() {
      for (var i=0; i < this.elevatorViews.length; i++) {
        this.$el.append(this.elevatorViews[i].render().$el);
      }
    },
    renderFloors: function() {
      var listItems = [];
      var _this = this;
      _.each(this.floorViews, function(floorView){
        listItems.push(floorView.render().$el);
        floorView.model.on("change:waiting", _this.dispatchElevator, _this);
      });
      this.$("#floors").append(listItems);
    },
    dispatchElevator: function(floor) {
      if (floor.get("waiting") == false){
        return;
      } else {
        this.sendClosestAvailableElevator(floor.get("number"));
      }
    },
    sendClosestAvailableElevator: function(floorNumber) {
      var elevatorNumber = 0;
      this.elevatorViews[elevatorNumber].sendTo(floorNumber);
    },
    updateWaitingStatus: function(elevatorView) {
      this.floorViews[elevatorView.model.get("currentFloor")].model.set("waiting", false);
    }
  });

  ElevatorView = Backbone.View.extend({
    id: "elevator",
    tagName: "ul",
    initialize: function() {
      this.template = _.template($("#elevatorTemplate").html());
    },
    render: function() {
      this.$el.html(this.template);
      this.setCurrent();
      this.model.on("change:currentFloor", this.setCurrent, this);
      return this;
    },
    setCurrent: function() {
      var currentFloor = this.model.get("currentFloor");
      this.$("li").removeClass("active");
      this.$("[data-floor='" + currentFloor + "']").addClass("active");
    },
    sendTo: function(floorNumber, callback) {
      this.model.set("currentFloor", floorNumber);
      this.trigger("arrived", this);
    }
  });

  FloorView = Backbone.View.extend({
    initialize: function() {
      this.template = _.template($("#floorTemplate").html());
    },
    events: {
      "click .call": "callElevator"
    },
    render: function() {
      this.$el.html(this.template(this.model.toJSON()));
      return this;
    },
    callElevator: function() {
      this.model.set("waiting", true);
    }
  });

  ElevatorModel = Backbone.Model.extend({
    defaults: {
      currentFloor: 1,
      direction: ''
    }
  });

  FloorModel = Backbone.Model.extend({
    defaults: {
      number: '',
      waiting: false
    }
  });

  elevator.mainView = new mainView();
  return elevator;
});
