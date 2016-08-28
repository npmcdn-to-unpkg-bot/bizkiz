var chartingData = {}

var Charts = {
  init: function(data) {
    console.log(data);
    if(chartingData[moment(data.transactionData.date).format('YYYY-MM-DD')]) {
      chartingData[moment(data.transactionData.date).format('YYYY-MM-DD')] += data.amount;
    } else {
      chartingData[moment(data.transactionData.date).format('YYYY-MM-DD')] = data.amount;
    }
    console.log(chartingData);
  }
};

function fn(chartingDataJson) {
  console.log("Here" + chartingDataJson);
  var chart = AmCharts.makeChart("chartdiv", {
    "type": "serial",
    "theme": "none",
    "marginRight": 40,
    "marginLeft": 40,
    "autoMarginOffset": 20,
    "mouseWheelZoomEnabled":true,
    "dataDateFormat": "YYYY-MM-DD",
    "valueAxes": [{
        "id": "v1",
        "axisAlpha": 0,
        "position": "left",
        "ignoreAxisWidth":true
    }],
    "balloon": {
        "borderThickness": 1,
        "shadowAlpha": 0
    },
    "graphs": [{
        "id": "g1",
        "balloon":{
          "drop":true,
          "adjustBorderColor":false,
          "color":"#ffffff"
        },
        "bullet": "round",
        "bulletBorderAlpha": 1,
        "bulletColor": "#FFFFFF",
        "bulletSize": 5,
        "hideBulletsCount": 50,
        "lineThickness": 2,
        "title": "red line",
        "useLineColorForBulletBorder": true,
        "valueField": "value",
        "balloonText": "<span style='font-size:18px;'>[[value]]</span>"
    }],
    "chartScrollbar": {
        "graph": "g1",
        "oppositeAxis":false,
        "offset":30,
        "scrollbarHeight": 80,
        "backgroundAlpha": 0,
        "selectedBackgroundAlpha": 0.1,
        "selectedBackgroundColor": "#888888",
        "graphFillAlpha": 0,
        "graphLineAlpha": 0.5,
        "selectedGraphFillAlpha": 0,
        "selectedGraphLineAlpha": 1,
        "autoGridCount":true,
        "color":"#AAAAAA"
    },
    "chartCursor": {
        "pan": true,
        "valueLineEnabled": true,
        "valueLineBalloonEnabled": true,
        "cursorAlpha":1,
        "cursorColor":"#258cbb",
        "limitToGraph":"g1",
        "valueLineAlpha":0.2,
        "valueZoomable":true
    },
    "valueScrollbar":{
      "oppositeAxis":false,
      "offset":50,
      "scrollbarHeight":10
    },
    "categoryField": "date",
    "categoryAxis": {
        "parseDates": true,
        "dashLength": 1,
        "minorGridEnabled": true
    },
    "export": {
        "enabled": true
    },
    "dataProvider": JSON.parse(chartingDataJson)
});
}

var Payments = {
  payments : [],
  paymentRef : {},
  totalPaid : 0,
  totalFee : 0,
  chartingDataJson : [],
  paymentDiv : $('#payments'),
  init : function(data, chartingDataJson) {
    var itemString = '';
    data.forEach((item) => {
      var description = item.description || 'N/A';
      this.payments.push(item);
      this.paymentRef[item.id] = item;
      this.totalPaid += item.amount;
      this.totalFee  += item.fee;
      itemString += `
      <div class="item">
        <div class="content">
          <div class="header">
            <a class="header pay-more" data-itemId=${item.id}>${item.amount}</a>
          </div>
          ${description} - ${item.transactionData.date}
        </div>
      </div>`
      Charts.init(item);
    });

    var counter = 0;
    for (var key in chartingData) {
      var tempData = '';
      var pvVal = '';

      if(counter == 0) {
        counter++;
      } else {
        pvVal = ',';
      }
      // var chartDt = {
      //   "date": key,
      //   "value": chartingData[key]
      // }
      // chartingDataJson.push(chartDt);

      tempData += '{"date" : "' + key +'",';
      tempData += '"value" : ' + chartingData[key] +'}';

      chartingDataJson = tempData + pvVal + chartingDataJson;

    }
    chartingDataJson = '[' + chartingDataJson + ']';
    console.info('first print' + chartingDataJson);
    this.paymentDiv.append(itemString);
    this.bindEvents();
    return chartingDataJson;
  },
  loadItemDetails : function(id, element){
    var item = this.paymentRef[id];
    var popup = $('div.popup');
    if (popup.length > 0) {
      $('div.popup').remove();
    }
    var appendable =  `<div class="ui fluid popup top left transition hidden">
    <div class="ui two column divided grid">
      <div class="column">
        ${item.paymentStatus}
      </div>
      <div class="column">
        ${item.source}
      </div>
    </div>`;
    $(element).parent().append(appendable);
    $('div.popup').removeClass('hidden').show();
    $('div.popup').on('click', function() {
      $('div.popup').hide();
    });

  },
  bindEvents : function(){
    $('a.pay-more', this.paymentDiv).on('click', function() {
      // $('div.popup').remove();
      Payments.loadItemDetails($(this).attr('data-itemId'), $(this));
    });
  },
  addElements : function() {
  }
};
const socket = io();
// Initialize our Feathers client application through Socket.io
// with hooks and authentication.
const app = feathers()
  .configure(feathers.socketio(socket))
  .configure(feathers.hooks())
  // Use localStorage to store our login token
  .configure(feathers.authentication({
    storage: window.localStorage
  })
);
const userService = app.service('users');
const paymentsService = app.service('payments');
app.authenticate().then(
  () => {
  paymentsService.find().then((data) => {
    var chartingDataJson = '';
    chartingDataJson = Payments.init(data.list, chartingDataJson);
    fn(chartingDataJson);
  });
  userService.find().then(
    page => {});
    // const users = page.data;
    // Add every user to the list
    // users.forEach(addUser);
  // });

  // We will also see when new users get created in real-time
  // userService.on('created', addUser);
});
