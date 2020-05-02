define([
    'dojo/_base/declare',
    'dojo/Evented',
    'dojo/_base/lang',
    'dijit/_TemplatedMixin', 
    'dijit/_WidgetBase',
    'dojo/topic',
    'esri/Graphic', 
    'esri/geometry/Extent', 
    'esri/geometry/support/webMercatorUtils',
    'esri/request',
    'dojo/text!./templates/DatasetSelectWidget.html'],
    function(
        declare,
        Evented,
        lang,
        _TemplatedMixin, 
        _WidgetBase,
        topic,
        Graphic,
        Extent,
        webMercatorUtils,
        esriRequest,
        widgetTemplate
    ){
        return declare([_WidgetBase, _TemplatedMixin, Evented], {
            // Widget's HTML template
            templateString: widgetTemplate,

            // default options
            options: {
                datafile: "./js/app/datasets.json",  // could be a URL
                topicName: "dataset/change"
            },

            // CSS class to be applied to the root node in our template
            baseClass: 'DatasetSelectWidget',

            datasets: null,

            //
            // Widget lifecycle methods. defined in the order in which they are called
            //
            constructor: function(options, srcRefNode) {
                // console.log('inside constructor...');
                var defaults = lang.mixin({}, this.options, options);
                this.domNode = srcRefNode;
                this.set("datafile", defaults.datafile);

                // name used by topic when publishing results
                this.set("topicName", defaults.topicName);
            },

            
            postCreate: function() {
                // console.log('inside postCreate')
                // assume we are overridng a method that may do something in a class up the inheritance chain
                this.inherited(arguments);
                this.loadDatasetList();
            },


            startup: function() {
            //   console.log('inside startup...');
            },

            destroy: function() {
                // console.log('inside destroy...')
                this.inherited(arguments);
            },


            //
            // utility methods
            //
            reset: function() {
                this._datasetSelect.selectedIndex = 0;
                this._descriptionPanel.textContent = "";
            },


            loadDatasetList: function() {
                // load the data file
                esriRequest(this.datafile, { responseType: "json"}).then(
                    function(response){
                        this.datasets = response.data;
                        // console.log(this.datasets);
                        this.populateDatasetSelect();
                        // this.memoryStore = new MemoryStore({data: response.data, idProperty: "id" });
                        // this.createFilteringSelect().bind(this);
                    }.bind(this),
                    function(error){
                        console.log('failed to load data file');
                });
            },

            populateDatasetSelect: function() {
                var select = this._datasetSelect;
                // add a placeholder
                var option = document.createElement("option");
                option.value = "";
                option.text = "select a dataset...";
                select.add(option);

                // var datasets = this.datasets.map(element => element.name);
                this.datasets.forEach(function(dataset){
                    var option = document.createElement("option");
                    option.value = dataset.name;
                    option.text = dataset.label;
                    select.add(option);
                })
            },


            updateDataset: function(event) {
                if (! event.target.value) {
                    this._descriptionPanel.textContent = ""
                    topic.publish(this.topicName, null);
                    return;
                }
        
                let dataset = this.getDatasetByName(event.target.value);
                // console.log('dataset is now ' + dataset.name);
                this._descriptionPanel.textContent = dataset.description;

                topic.publish(this.topicName, dataset);

            },

            getDatasetByName: function(name) {
                // assumes name is unique among datasets
                return (this.datasets.find(element => element.name == name ));
            }
        });
    });
