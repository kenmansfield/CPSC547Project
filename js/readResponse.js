
var url = "http://app.knomos.ca/api/cases/bcca/2013/173/citations";
var index = 0;



// The data we parse from the JSON responses.
// ie. the list of citations per each case
var caseArray = [];

// The cases, ie. the case in caseIndice[x] has its citations in 
// caseArray[x]
var caseIndices = [];

// This will store the names that will be displayed on the viz.
var namesArray = [];

// This is the actual dependency matrix pushed to d3.
var referenceMatrix = [];

var chart;

var theUsername;
var thePassword;

function dataSubmitted()
{
	caseArray = [];
	caseIndices = [];
	namesArray = [];
	referenceMatrix = [];
	index = 0;
	
	// Start with our very first. 
	// Replace this in the future with whatever our input is.
	d3.select('#chart_placeholder svg').remove();
	var form = document.getElementById('inputForm');
	
	var caseNumber = form.theCaseNum.value;
	var caseYear =  form.theCaseYear.value;
	
	
	url = "http://app.knomos.ca/api/cases/bcca/" + caseYear + 
	"/" + caseNumber + "/citations";
		
	caseIndices.push("" + caseYear + caseNumber);
	
	newRequest();
}

function newRequest()
{
	var xmlhttp = new XMLHttpRequest();
	
	var form = document.getElementById('authForm');
	theUsername = form.username.value;
	thePassword =  form.password.value;

	xmlhttp.onreadystatechange=function() {
		if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
			referenceLoad(xmlhttp.responseText);
			document.getElementById("errorMessage").innerHTML = "";
		}
		else
		{
			//handle error.
			document.getElementById("errorMessage").innerHTML = xmlhttp.responseText;
		}
	}
	xmlhttp.open("GET", url, true);

	xmlhttp.setRequestHeader ("Authorization", "Basic " + btoa(theUsername + ":" + thePassword));	
	xmlhttp.send();
}

function referenceLoad(response)
{
	caseArray.push(parseFunction(response, index));
	
	//okay, that response is hopefully parsed.
	//parse everything that it has loaded.
	
	var arrayLength = caseArray[0].length;
	
	if( arrayLength <= index)
	{
		//Now we've built an array with all the 1st and 2nd degree citations.
		//Next we need to build our dependency matrix.
		//First, we need the labels for each.
		//need to go through entire array to get unique id's.
		createUniqueNameList();
		
		//now build our matrix!
		referenceMatrix = buildMatrix();
		
		//With our matrix, and our name list we can now create our d3 wheel!!!!
		doD3();
		return;
	}
	
	caseIndices.push("" + caseArray[0][index].case_year + caseArray[0][index].case_num);
	
	url = "http://app.knomos.ca/api/cases/bcca/" + caseArray[0][index].case_year + 
		"/" + caseArray[0][index].case_num + "/citations";
		
	index++;
	newRequest();

	//increment so.
}

//This function stores all of the citations for that case into the
//array at the index.
function parseFunction(response) 
{
    var obj = JSON.parse(response);
	var newCaseArray = [];
	
	obj.general_case.outgoing.forEach(function(ref) 
	{
		console.log(ref.target_case.citation);
		var caseObj = new Object();
		caseObj.case_num = ref.target_case.case_num;
		caseObj.case_year = ref.target_case.year;
		if(caseObj.case_num && caseObj.case_year)
		{
			newCaseArray.push(caseObj);
		}
	});

	obj.general_case.incoming.forEach(function(ref) 
	{
		var caseObj = new Object();
		console.log(ref.source_case.citation);
		
		caseObj.case_num = ref.source_case.case_num;
		caseObj.case_year = ref.source_case.year;
		if(caseObj.case_num && caseObj.case_year)
		{
			newCaseArray.push(caseObj);
		}
	});
	return newCaseArray;
}

function createUniqueNameList()
{
	var thelength = caseArray.length;
	for(i = 0; i < thelength; i++)
	{
		for(j = 0; j < caseArray[i].length; j++)
		{
			//probably need to change this to somethign more informative. 
			var name = "" + caseArray[i][j].case_year + caseArray[i][j].case_num;
			if(namesArray.indexOf(name) == -1)
			{
				namesArray.push(name);
			}
		}
	}
}

function buildMatrix()
{
	var retArray = [];
	for(i = 0; i < namesArray.length; i++)
	{
		retArray[i] = [];
		for(j = 0; j < namesArray.length; j++)
		{	
			retArray[i][j] = 0;
		}
	}
		
	for(i = 0; i < namesArray.length; i++)
	{
		for(j = 0; j < namesArray.length; j++)
		{	
			retArray[i][j] = 0;
			var x = caseIndices.indexOf(namesArray[i]);
			
			if( x >= 0 )
			{
				for(z = 0; z < caseArray[x].length; z++)
				{
					var tempString = "" + caseArray[x][z].case_year + caseArray[x][z].case_num;
					if(tempString == namesArray[j])
					{
						retArray[i][j] = 2;
					}
				}
			}
		}
	}
	return retArray;
}

function doD3()
{
	d3.select("svg").remove();
	var data = {
		packageNames: namesArray,
		matrix: referenceMatrix
	  };
	 
	chart = d3.chart.dependencyWheel().width(800)    // also used for height, since the wheel is in a a square 
	.margin(120)   // used to display package names 
	.padding(.02) // separating groups in the wheel 

	d3.select("body").transition();
	d3.select('#chart_placeholder svg').remove(); 
	d3.select("svg").remove();	
	d3.select('#chart_placeholder').datum(data).call(chart);
	d3.select('#chart_placeholder').transition();
	
}