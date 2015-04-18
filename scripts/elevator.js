define(["backbone", "underscore"], function(Backbone, _) {
  var elevator = {};
  var settings = {
    numElevators: 1,
    numFloors: 10
  };

  var mainView = Backbone.View.extend({
    el: ".container",
    elevatorViews: [],
    elevatorCollection: '',
    floorViews: [],
    floorCollection: '',
    initialize: function() {
      this.elevatorCollection = new ElevatorCollection();
      this.floorCollection = new FloorCollection();

      for (var i=settings.numFloors; i > 0; i--) {
        var model = new FloorModel({number: i});
        this.floorCollection.add(model);
        var view = new FloorView({model: model});
        this.floorViews.push(view);
      }

      for (var i=0; i < settings.numElevators; i++) {
        var currentFloor = Math.floor((Math.random() * settings.numFloors + 1));
        var model = new ElevatorModel({currentFloor: currentFloor});
        this.elevatorCollection.add(model);
        var view = new ElevatorView({model: model});
        this.elevatorViews.push(view);
      }

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
      this.floorViews.forEach(function(floorView){
        listItems.push(floorView.render().$el);
        floorView.model.on("change:waiting", _this.dispatchElevator, _this);
      });
      this.$(".floors").append(listItems);
    },
    dispatchElevator: function(floor) {
      if (floor.get("waiting") === false) {
        return;
      }
      this.sendClosestAvailableElevator(floor);
    },
    sendClosestAvailableElevator: function(floor) {
      var closestAvailableElevator;
      var numFloorsAway;
      var availableElevators;
      var floorStack;
      var floorNumber = floor.get("number");

      availableElevators = this.elevatorViews.filter(function(elevatorView) {
        var direction = elevatorView.model.get("direction");
        //if (!direction || direction === floor.get("direction"))
      });

      this.elevatorViews.forEach(function(elevatorView) {
        var currentFloor;
        var floorsToGo;

        currentFloor = elevatorView.model.get("currentFloor");
        floorsToGo = Math.abs(floorNumber - currentFloor);

        // if we find a closer elevator
        if (!closestAvailableElevator || floorsToGo < numFloorsAway) {
          closestAvailableElevator = elevatorView;
          numFloorsAway = floorsToGo;
        }
      });

      closestAvailableElevator.on("arrived", this.updateFloorWaitingStatus, this);
      floorStack = closestAvailableElevator.model.get("floorStack").concat();
      floorStack.push(floorNumber);
      floorStack.sort();
      closestAvailableElevator.model.set("floorStack", floorStack);
    },
    updateFloorWaitingStatus: function(elevatorView) {
      this.floorCollection
          .findWhere({"number": elevatorView.model.get("currentFloor")})
          .set({"waiting": false, "direction": undefined});
    }
  });

  ElevatorView = Backbone.View.extend({
    className: "elevator",
    tagName: "ul",
    floorSelectHTML: (function(){
      return _.template($("#floorSelectTemplate").html())({numFloors: settings.numFloors});
    }()),
    initialize: function() {
      this.template = _.template($("#elevatorTemplate").html());
      this.model.on("change:direction", this.render, this);
      this.model.on("change:floorStack", this.manageFloorStack, this);
    },
    events: {
      "change .floorNumber": "floorChosen"
    },
    render: function() {
      this.$el.html(this.template(_.extend({numFloors: settings.numFloors}, this.model.toJSON())));
      this.$(".controls").append(this.floorSelectHTML);
      this.setCurrent();
      this.model.on("change:currentFloor", this.setCurrent, this);
      return this;
    },
    setCurrent: function() {
      var currentFloor = this.model.get("currentFloor");
      this.$("li").removeClass("active");
      this.$("[data-floor='" + currentFloor + "']").addClass("active");
    },
    manageFloorStack: function() {
      // elevator is already moving
      if (this.model.get("direction")) {
        return;
      } else {
        this.startElevator();
      }
    },
    startElevator: function() {
      var destination = this.model.get("floorStack")[0];
      var floorStack = this.model.get("floorStack");
      var currentFloor = this.model.get("currentFloor");
      var _this = this;

      console.log("current floor stack: " + this.model.get("floorStack"));

      var floorsToGo = destination - currentFloor;
      if (floorsToGo < 0) {
        this.model.set("direction", "down");
      } else {
        this.model.set("direction", "up");
      }

      var moveFloors = function moveFloors() {
        // if we are at a floor someone called
        if (floorsToGo && _this.model.get("floorStack").indexOf(currentFloor) > -1) {
          _this.trigger("arrived", _this);
          _this.model.set("floorStack", _this.model.get("floorStack").shift());
        }

        if (floorsToGo !== 0) {
          console.log("floorsToGo: " + floorsToGo);
          console.log("destination: " + destination);
          setTimeout(function(){
            if (floorsToGo < 0) {
              _this.model.set("currentFloor", currentFloor - 1);
              currentFloor -= 1;
              floorsToGo += 1;
            } else {
              _this.model.set("currentFloor", currentFloor + 1);
              currentFloor += 1;
              floorsToGo -= 1;
            }
            moveFloors();
          }, 1000);
        } else {
          _this.trigger("arrived", _this);
          _this.model.set("floorStack", []);
          _this.model.set("direction", undefined);
        }
      }
      moveFloors();
    },
    floorChosen: function(e) {
      this.startElevator(e.target.value);
    }
  });

  FloorView = Backbone.View.extend({
    initialize: function() {
      this.template = _.template($("#floorTemplate").html());
      this.model.on("change:waiting", this.setActiveArrow, this);
    },
    events: {
      "click .call": "callElevator",
    },
    render: function() {
      this.$el.html(this.template(_.extend({numFloors: settings.numFloors}, this.model.toJSON())));
      return this;
    },
    callElevator: function(e) {
      this.model.set({"waiting": true, "direction": $(e.target).data('direction')});
      this.$el.addClass("waiting");

      var _this = this;
      this.model.once("change:waiting", function() {
        _this.$el.removeClass("waiting");
      });
    },
    setActiveArrow: function(floor) {
      if (floor.get("waiting")) {
        this.$(".controls span[data-direction='" + floor.get("direction") + "']")
            .addClass("active");
      }
    }
  });

  ElevatorModel = Backbone.Model.extend({
    defaults: {
      currentFloor: 1,

      // direction can be 'up', 'down', or undefined
      direction: undefined,

      // array to keep track of which floors and what order the elevator
      // should stop at. The 0th element is the next one to be visited
      floorStack: []
    }
  });

  ElevatorCollection = Backbone.Collection.extend({
    model: ElevatorModel
  });

  FloorModel = Backbone.Model.extend({
    defaults: {
      number: '',
      
      // waiting can be true or false
      waiting: false,

      // direction can be 'up', 'down', or undefined and should only
      // be defined when waiting is set to true
      direction: false
    }
  });

  FloorCollection = Backbone.Collection.extend({
    model: FloorModel
  });

  elevator.mainView = new mainView();
  return elevator;
});
