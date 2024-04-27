document.addEventListener('DOMContentLoaded', function () {

  const bodyElement = document.getElementById('body');
  const text_input = document.getElementById('text_input');
  const primaryElement = document.getElementById('primary');
  const sinusuriElement = document.getElementById('sinusuri');
  const resultsElement = document.getElementById('results');
  const clear_btn = document.getElementById('clear_btn');
  const analyze_btn = document.getElementById('analyze_btn');
  const cancel_btn = document.getElementById('cancel_btn');
  const bago_btn = document.getElementById('bago_btn');
  const h1Element = document.getElementById('resulta');
  const logo = document.getElementById('logo');

  // Declare AbortController
  const abortController = new AbortController();

  function addResults(predictionsMap, res) {
    // Find the tbody element of the resultTable
    var tableBody = document.querySelector('#resultTable tbody');
    tableBody.innerHTML = "";
    // Iterate over the predictions map
    for (const modelName in predictionsMap) {
      if (predictionsMap.hasOwnProperty(modelName)) {
        // Get the predictions array for the current model
        var predictions = predictionsMap[modelName];

        // Determine the title (model name) and artist (prediction value)
        var title = modelName;
        var resValue = res ? 'Lehitimo' : 'Peke';
        var predictionValue = predictions[res ? 1 : 0]; // Use the second item if res is true, otherwise use the first item

        // Convert predictionValue to percentage with two decimal points
        var percentage = (predictionValue * 100).toFixed(2) + '%';
        // Create a new table row element
        var newRow = document.createElement('tr');

        // Create table data (cells) for the new row
        var modelCell = document.createElement('td');
        modelCell.textContent = title;
        modelCell.className = 'text-left';

        var predictCell = document.createElement('td');
        predictCell.textContent = percentage;

        var resCell = document.createElement('td');
        resCell.textContent = resValue;

        // Append the cells to the new row
        newRow.appendChild(modelCell);
        newRow.appendChild(predictCell);
        newRow.appendChild(resCell);

        // Append the new row to the tbody
        tableBody.appendChild(newRow);
      }
    }
  }

  analyze_btn.addEventListener('click', function (event) {
    event.preventDefault();
    const text = text_input.value;

    if (text.length >= 100) {
      showAnalyze();

      const csrftoken = getCookie('csrftoken');
      setTimeout(() => {
        fetch('/analyze_text/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrftoken
          },
          body: JSON.stringify({ text: text }),
          signal: abortController.signal
        })
          .then(response => {
            if (!response.ok) {
              throw new Error('Network response was not ok');
            }
            return response.json();
          })
          .then(data => {
            // console.log('Response data:', data);
            const trueValue = (data.true * 100).toFixed(2);
            const falseValue = (data.false * 100).toFixed(2);

            // Determine result based on values
            const isTrueResult = trueValue > falseValue;
            const result = isTrueResult ? 'Lehitimo' : 'Peke';
            const trueColor = isTrueResult ? 'rgba(72, 187, 120, 1.0)' : '#CFCFCF';
            const falseColor = isTrueResult ? '#CFCFCF' : 'rgba(224, 102, 102, 1.0)';

            // Update UI elements based on result
            bodyElement.classList.remove('bg-blue');
            bago_btn.classList.remove('hidden');
            bodyElement.classList.add(isTrueResult ? 'bg-green' : 'bg-red');
            newSrc = isTrueResult ? "/static/detector/images/factify-green.png" : "/static/detector/images/factify-red.png"
            logo.src = newSrc;
            h1Element.style.color = isTrueResult ? trueColor : falseColor;
            h1Element.textContent = result;

            // Add results to table
            addResults(data.predictions, isTrueResult);

            // Render doughnut chart with result colors and values
            renderDoughnutChart(result, trueColor, trueValue, falseColor, falseValue, isTrueResult ? trueValue : falseValue);

            // Show results immediately
            showResults();
          })
          .catch(error => {
            if (error.name === 'AbortError') {
              // console.log('Fetch aborted:', error.message);
            } else {
              console.error('Fetch error:', error);
            }
          });
      }, 2000);
    } else {
      alert('Mangyaring mag-input ng hindi bababa sa 100 na karakter.');
    }
  });

  // Function to render doughnut chart
  let myChart = null; // Global variable to keep track of the Chart.js instance

  function renderDoughnutChart(result, trueColor, trueValue, falseColor, falseValue, resultValue) {
    if (myChart) {
      myChart.destroy(); // Destroy the previous chart instance
    }

    // Determine labels based on the result value
    const labels = result === 'Lehitimo' ? ['Lehitimo', 'Peke'] : ['Peke', 'Lehitimo'];
    const r = result === 'Lehitimo' ? 72 : 224;
    const g = result === 'Lehitimo' ? 187 : 102;
    const b = result === 'Lehitimo' ? 120 : 102;


    // Define dataset properties based on the result value
    const datasetRes = {
      data: result === 'Lehitimo' ? [trueValue, falseValue] : [falseValue, trueValue],
      borderRadius: 10,
      backgroundColor: result === 'Lehitimo' ? [trueColor, '#CFCFCF'] : [falseColor, '#CFCFCF'],
      hoverBackgroundColor: result === 'Lehitimo' ? [trueColor, '#CFCFCF'] : [falseColor, '#CFCFCF'],
      borderWidth: 0
    };

    // Construct the data object
    const data = {
      labels: labels,
      datasets: [
        datasetRes,
        {
          label: [],
          data: [resultValue, r, g, b],
          backgroundColor: ['white'],
          hoverBackgroundColor: ['white'],
        }
      ]
    };

    const options = {
      responsive: true,
      cutout: '75%',
      elements: {
        arc: {
          borderWidth: 0
        }
      },
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            usePointStyle: true,
            boxWidth: 7.5,
            boxHeight: 7.5,
            padding: 20
          }
        },
        tooltip: {
          filter: function (tooltipItem) {
            return tooltipItem.datasetIndex === 0;
          },
          callbacks: {
            label: function (tooltipItem) {
              return tooltipItem.raw + '%';
            }
          }
        }
      },
    };

    const config = {
      type: 'doughnut',
      data,
      options,
    };

    // Register the chart plugin for label color transition
    Chart.register({
      id: 'doughnutLabel',
      beforeDatasetsDraw(chart, args, pluginOptions) {
        const { ctx, data, chartArea } = chart;

        // Calculate text size based on chart dimensions
        const fontSize = Math.min(chartArea.width / 5.5, chartArea.height / 5.5);

        ctx.save();

        // Center text within the chart
        const centerX = (chartArea.left + chartArea.right) / 2;
        const centerY = (chartArea.top + chartArea.bottom) / 2;

        // Calculate current alpha based on elapsed time
        const elapsedTime = Date.now() - startTime;
        const duration = 1000; // Duration for label color transition (in milliseconds)
        let alpha = Math.min(elapsedTime / duration, 1.0);

        // Construct the RGBA color string with the updated alpha value
        const updatedColor = `rgba(${data.datasets[1].data[1]}, ${data.datasets[1].data[2]}, ${data.datasets[1].data[3]}, ${alpha.toFixed(2)})`;;

        ctx.font = `bold ${fontSize}px Inter`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = updatedColor;
        ctx.fillText(`${data.datasets[1].data[0]}%`, centerX, centerY);

        ctx.restore();
      }
    });

    // Create a new Chart.js instance with updated data and options
    const resultChartElement = document.getElementById('resultChart');
    myChart = new Chart(resultChartElement, config);

    // Start the animation by updating the start time
    startTime = Date.now();
  }


  clear_btn.addEventListener('click', function () {
    text_input.value = '';
    clear_btn.classList.add('hidden');
  });

  cancel_btn.addEventListener('click', function () {
    // Abort the fetch request
    abortController.abort();

    text_input.classList.remove('input_disabled');
    text_input.disabled = false;

    primaryElement.classList.remove('hidden');
    analyze_btn.classList.remove('hidden');
    sinusuriElement.classList.add('hidden');
    cancel_btn.classList.add('hidden');
    clear_btn.classList.add('hidden');
  });

  function showAnalyze() {
    sinusuriElement.classList.remove('hidden');
    cancel_btn.classList.remove('hidden');

    text_input.disabled = true;
    text_input.classList.add('input_disabled');
    primaryElement.classList.add('hidden');
    clear_btn.classList.add('hidden');
    analyze_btn.classList.add('hidden');
  }

  bago_btn.addEventListener('click', function () {
    bodyElement.classList.add('bg-blue');
    bodyElement.classList.remove('bg-green');
    bodyElement.classList.remove('bg-red');

    text_input.value = '';
    text_input.classList.remove('input_disabled');
    text_input.disabled = false;

    primaryElement.classList.remove('hidden');
    bago_btn.classList.add('hidden');
    sinusuriElement.classList.add('hidden');
    cancel_btn.classList.add('hidden');
    clear_btn.classList.add('hidden');
    resultsElement.classList.add('hidden');
    myChart.destroy();
    myChart = null;
    logo.src = "/static/detector/images/factify.png";
  });

  function showResults() {
    resultsElement.classList.remove('hidden');

    sinusuriElement.classList.add('hidden');
    cancel_btn.classList.add('hidden');
    primaryElement.classList.add('hidden');
    clear_btn.classList.add('hidden');
    analyze_btn.classList.add('hidden');
  }

  function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
      const cookies = document.cookie.split(';');
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.startsWith(name + '=')) {
          cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
          break;
        }
      }
    }
    return cookieValue;
  }

  // Function to toggle visibility of clear button based on input length
  function toggleClearButton() {
    if (text_input.value.length > 0) {
      clear_btn.classList.remove('hidden'); // Show clear button
    } else {
      clear_btn.classList.add('hidden'); // Hide clear button
    }

    if (text_input.value.length >= 100) {
      analyze_btn.classList.remove('hidden'); // Show analyze button
    } else {
      analyze_btn.classList.add('hidden'); // Hide analyze button
    }
  }

  // Add input event listener to text input
  text_input.addEventListener('input', toggleClearButton);

  toggleClearButton();
});
