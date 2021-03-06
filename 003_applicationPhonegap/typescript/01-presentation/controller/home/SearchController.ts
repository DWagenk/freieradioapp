/// <reference path="../MasterUpdatableController.ts"/>
/// <reference path="../../view/IView.ts"/>
/// <reference path="../../router/IRouter.ts"/>

/// <reference path="../../../02-business/service/station/StationService.ts"/>
/// <reference path="../../../02-business/entities/station/StationEntity.ts"/>

/// <reference path="../../../02-business/service/stationdetail/BroadcastsService.ts"/>
/// <reference path="../../../02-business/businessentities/stationdetail/BroadcastsEntityWithStationName.ts"/>

/// <reference path="../../../99-utilities/di/DIContainer.ts"/>

/// <reference path="../../location/GeolocationHelper.ts"/>
/// <reference path="../../location/DistanceSorting.ts"/>

/// <reference path="../../../99-utilities/navigation/URLParameters.ts"/>
/// <reference path="../../../99-utilities/runtime/PlatformEvent.ts"/>

/// <reference path="../../../98-frameworks/jquery/jquery.d.ts"/>

module freeradios.presentation.controller.home
{
    export class SearchController extends MasterUpdatableController
    {
        private _stationService : business.service.station.StationService;
        private _broadcastsService : business.service.stationdetail.BroadcastsService;
        private _distanceSorting : location.DistanceSorting;
        private _geolocationHelper : location.GeolocationHelper
        private _sortByDistance : boolean;
        private _searchText : string;
        
        constructor(view? : view.IView, masterView? : view.IView, geolocationHelper? : location.GeolocationHelper)
        {
            super("Suche", "templates/home/search.html", view, masterView);
            
            this._stationService = new business.service.station.StationService();
            this._broadcastsService = new business.service.stationdetail.BroadcastsService();
            
            this._distanceSorting = new location.DistanceSorting();
            
            this._geolocationHelper = utilities.di.DIContainer.get<freeradios.presentation.location.GeolocationHelper>(
                "freeradios.presentation.location.GeolocationHelper",
                geolocationHelper
            );
            
            this._sortByDistance = utilities.navigation.URLParameters.getParameterBoolean("sort_by_distance") && this._geolocationHelper.getEnabled();
            this._searchText = utilities.navigation.URLParameters.getParameter("search") || "";            
        }    
        
        public createView(callback : (view : view.IView) => any)
        {
            var self = this;
            
            super.createView(function(view : view.IView)
            {
                self.updateViewAssignments(view, function()
                {
                    callback(view);
                });
            });
        }
        
        public updateViewAssignments(view : view.IView, finishCallback : () => any)
        {
            (function(self : SearchController)
            {
                if (self._searchText.replace(/[ \r\n\t]/g, "").length > 0)
                {
                    self._stationService.search(self._searchText, function(stations : Array<business.entities.station.StationEntity>)
                    {
                        self._broadcastsService.searchWithStationName(self._searchText, function(broadcasts : Array<business.businessentities.stationdetail.BroadcastsEntityWithStationName>)
                        {
                            if (self._sortByDistance)
                            {
                                stations = self._distanceSorting.sortStationsByCurrentDistance(stations);
                            }
                            
                            view.assign("searchText", self._searchText);
                            view.assign("sortByDistance", self._sortByDistance);
                            view.assign("stations", stations);                    
                            view.assign("broadcasts", broadcasts);
                            finishCallback();
                        });
                    });
                }
                else
                {
                    self._stationService.getStationList(function(stations : Array<business.entities.station.StationEntity>)
                    {
                        self._broadcastsService.getListWithStationName(function(broadcasts : Array<business.businessentities.stationdetail.BroadcastsEntityWithStationName>)
                        {
                            if (self._sortByDistance)
                            {
                                stations = self._distanceSorting.sortStationsByCurrentDistance(stations);
                            }
                            
                            view.assign("searchText", self._searchText);
                            view.assign("sortByDistance", self._sortByDistance);
                            view.assign("stations", stations);                    
                            view.assign("broadcasts", broadcasts);
                            finishCallback();
                        });
                    });
                }
            }(this));
        }
        
        public destroyView()
        {         
            super.destroyView();
        }
        
        public onready()
        {
            super.onready();
            this.bindListeners();
        }
        
        public bindListeners()
        {
            if (!this._geolocationHelper.getEnabled())
            {
                $("#searchMethod").hide();
            }
            
            (function(self : SearchController)
            {
                $("#searchInput").keyup(function()
                {
                    self._searchText = $("#searchInput").val();
                    self.getRouter().setParameter("search", self._searchText);
                    self._updateLists();                    
                });
                
                utilities.runtime.PlatformEvent.bindClickListenerJQuery($("#searchIcon"), function()
                {
                    self._searchText = $("#searchInput").val();
                    self.getRouter().setParameter("search", self._searchText);
                    self._updateLists();
                });
                
                utilities.runtime.PlatformEvent.bindClickListenerJQuery($("#searchMethod"), function()
                {
                    if (self._geolocationHelper.getEnabled())
                    {
                        self._sortByDistance = !self._sortByDistance;
                        
                        if (self._sortByDistance)
                        {
                            $("#searchMethod").attr("src", "img/02_list/toggle-button_ABC.png");
                        }
                        else
                        {
                            $("#searchMethod").attr("src", "img/02_list/toggle-button_location.png");                            
                        }
                        
                        self.getRouter().setParameter("sort_by_distance", self._sortByDistance);
                        
                        self._updateLists();
                    }
                });
                
                utilities.runtime.PlatformEvent.bindClickListenerJQuery($("#searchClose"), function()
                {
                    $("#searchInput").val("");
                    self.getRouter().setParameter("search", "");
                    self._searchText = "";
                    self._updateLists();
                });
                
                $("#searchInput").focus(function()
                {
                    $("#searchClose").css("visibility", "visible");
                });
                
                utilities.runtime.PlatformEvent.bindClickListenerJQuery($(document.body), function(e : JQueryEventObject)
                {
                    if (e.originalEvent.target !== $("#searchClose").get(0) && e.originalEvent.target !== $("#searchInput").get(0))
                    {
                        $("#searchClose").css("visibility", "hidden");
                    }
                });
            }(this));
        }
        
        private _updateLists()
        {
            var view = this.getView();
            
            this.updateViewAssignments(view, function()
            {
                view.updateView("#listStations");
                view.updateView("#listBroadcasts");
            });
        }
    }
}