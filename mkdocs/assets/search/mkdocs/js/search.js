require([
    base_url + '/mkdocs/js/mustache.min.js',
    base_url + '/mkdocs/js/lunr-0.6.0.min.js',
    'text!search-results-template.mustache',
    'text!../search_index.json',
], function (Mustache, lunr, results_template, data) {
   "use strict";

    function getSearchTerm()
    {
        var sPageURL = window.location.search.substring(1);
        var sURLVariables = sPageURL.split('&');
        for (var i = 0; i < sURLVariables.length; i++)
        {
            var sParameterName = sURLVariables[i].split('=');
            if (sParameterName[0] == 'q')
            {
                return decodeURIComponent(sParameterName[1].replace(/\+/g, '%20'));
            }
        }
    }

    var index = lunr(function () {
        this.field('title', {boost: 10});
        this.field('text');
        this.ref('location');
    });

    data = JSON.parse(data);
    var documents = {};

    var d = function(){
        return new Date().getTime();
    }

    var before_load = d()
    for (var i=0; i < data.docs.length; i++){
        var doc = data.docs[i];

        doc.location = base_url + doc.location;
        var before = d();
        index.add(doc);
        var time = d() - before;
        if (time > 50 ){
            console.log(doc.location + " " + time);
        }
        documents[doc.location] = doc;
    }
    console.log("Index load: end " + (d() - before_load));
    console.log("len " + data.docs.length);

    var search = function(){

        var query = document.getElementById('mkdocs-search-query').value;
        var search_results = document.getElementById("mkdocs-search-results");

        search_results.innerHTML = "<p>Searching</p>";

        while (search_results.firstChild) {
            search_results.removeChild(search_results.firstChild);
        }

        if(query === ''){
            return;
        }

        var results = index.search(query);

        if (results.length > 0){
            for (var i=0; i < results.length; i++){
                var result = results[i];
                doc = documents[result.ref];
                doc.base_url = base_url;
                doc.summary = doc.text.substring(0, 200);
                var html = Mustache.to_html(results_template, doc);
                search_results.insertAdjacentHTML('beforeend', html);
            }
        } else {
            search_results.insertAdjacentHTML('beforeend', "<p>No results found</p>");
        }

        if(jQuery){
            /*
             * We currently only automatically hide bootstrap models. This
             * requires jQuery to work.
             */
            jQuery('#mkdocs_search_modal a').click(function(){
                jQuery('#mkdocs_search_modal').modal('hide');
            })
        }

    };

    var search_input = document.getElementById('mkdocs-search-query');

    var term = getSearchTerm();
    if (term){
        search_input.value = term;
        search();
    }

    search_input.addEventListener("keyup", search);

});
