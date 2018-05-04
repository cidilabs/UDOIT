/**
*   Copyright (C) 2014 University of Central Florida, created by Jacob Bates, Eric Colon, Fenel Joseph, and Emily Sachs.
*
*   This program is free software: you can redistribute it and/or modify
*   it under the terms of the GNU General Public License as published by
*   the Free Software Foundation, either version 3 of the License, or
*   (at your option) any later version.
*
*   This program is distributed in the hope that it will be useful,
*   but WITHOUT ANY WARRANTY; without even the implied warranty of
*   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
*   GNU General Public License for more details.
*
*   You should have received a copy of the GNU General Public License
*   along with this program.  If not, see <http://www.gnu.org/licenses/>.
*
*   Primary Author Contact:  Jacob Bates <jacob.bates@ucf.edu>
*/

function json_tableify(data) {
	let table = document.createElement('table');
	let tbody = document.createElement('tbody');
	let columns = addAllColumnHeaders(data, table);
	for (let i=0, maxi=data.length; i < maxi; ++i) {
		let tr = document.createElement('tr');
		for (let j=0, maxj=columns.length; j < maxj ; ++j) {
			let td = document.createElement('td');
			cellValue = data[i][columns[j]];
			td.appendChild(document.createTextNode(data[i][columns[j]]));
			tr.appendChild(td);
		}
		tbody.appendChild(tr);
	}

	table.appendChild(tbody);

	return table;
}

function addAllColumnHeaders(data, table){
	let columnSet = [],
	thead = document.createElement('thead');
	tr = document.createElement('tr');
	for (let key in data[0]) {
		if (data[0].hasOwnProperty(key) && columnSet.indexOf(key)===-1) {
			columnSet.push(key);
			let th = document.createElement('th');
			th.appendChild(document.createTextNode(key));
			tr.appendChild(th);
		}
	}
	thead.appendChild(tr);
	table.appendChild(thead);
	return columnSet;
}

function addDeauthButton(data, table){
	// Append header
	let th = document.createElement('th');
	th.innerHTML = "Force Reauthorization";
	table.tHead.rows[0].appendChild(th);
	// Append body
	for(i = 1; i < table.rows.length; i++) {
		let td = document.createElement('td');
		let button = document.createElement('button');
		button.className = "btn btn-danger btn-sm";
		button.innerHTML = 'Force Reauthorize';
		button.value = data[i - 1]["User ID"];
		button.onclick = function() {
			let request = $.ajax({
				url: 'api/users.php?action=deauth&user_id='+button.value,
				method: 'GET',
				dataType: 'json',
				success: function(msg){
					button.disabled = "disabled";
					button.innerHTML = "Deauthorized";
				},
				error: function(xhr, status, error){
					response = JSON.parse(xhr.responseText);
					$('#user-results').html(response.data);
				}
			});
		};
		td.appendChild(button);

		table.rows[i].appendChild(td);
	}

	return table;
}

function downloadCSV(csv, filename) {
    let csvFile;
    let downloadLink;
    csvFile = new Blob([csv], {type: "text/csv"});
    downloadLink = document.createElement("a");
    downloadLink.download = filename;
    downloadLink.href = window.URL.createObjectURL(csvFile);
    downloadLink.style.display = "none";
    document.body.appendChild(downloadLink);
    downloadLink.click();
}

function tableToCSV(html, filename) {
	let csv = [];
	let rows = document.querySelectorAll(html + " table tr");
    for (var i = 0; i < rows.length; i++) {
		var row = [], cols = rows[i].querySelectorAll("td, th");
        for (var j = 0; j < cols.length; j++)
            row.push(cols[j].innerText);
		csv.push(row.join(","));
	}
    downloadCSV(csv.join("\n"), filename);
}

$('#scans-pull').on('submit', function(evt){
	evt.preventDefault();
	let formvals = $(this).serialize();
	$('#scans-results').empty();

	$('#scans-submit').empty();
	$('#scans-submit').append('<span class="circle-white" style="display: inline-block; height: 16px; width: 16px;"></span> Loading...');

	let request = $.ajax({
		url: 'api/stats.php?stat=scans&'+formvals,
		method: 'GET',
		dataType: 'json',
		success: function(msg){
			let table = json_tableify(msg.data);
			$(table).addClass('table table-striped');

			$('#scans-results').append(table);

			$('#scans-csv').removeClass('hidden');
			$('#scans-csv').click(function(){
				tableToCSV('#scans-results', "UDOIT_Scans.csv");
			});

			$('#scans-submit').empty();
			$('#scans-submit').append('Update Results');

			// Lazy load Term (ID), Course, and User and update table
			// TODO: Make this more modular, I just couldn't get it to work outside of this function
			var loadCourses = function(i) {
				if(msg.data.length == i) {
					return;
				}

				$.ajax({
					url: 'api/stats.php?stat=courseinfo&id='+msg.data[i]['Course (ID)'],
					method: 'GET',
					dataType: 'json',
					success: function(msg2){
						msg.data[i]['Term (ID)'] = msg2.data['Term'];
						msg.data[i]['Course (ID)'] = msg2.data['Course'] + ' (' + msg.data[i]['Course (ID)'] + ')';
						$('#scans-results').empty();
						table = json_tableify(msg.data);
						$(table).addClass('table table-striped');
						$('#scans-results').append(table);
					},
					error: function(xhr, status, error){
						response = JSON.parse(xhr.responseText);
						console.log(response);
					},
					complete: function(){
						loadCourses(++i);
					}
				});
			}
			loadCourses(0);
			var loadUsers = function(i) {
				if(msg.data.length == i) {
					return;
				}

				$.ajax({
					url: 'api/stats.php?stat=username&id='+msg.data[i]['User (ID)'],
					method: 'GET',
					dataType: 'json',
					success: function(msg2){
						msg.data[i]['User (ID)'] = msg2.data + ' (' + msg.data[i]['User (ID)'] + ')';
						$('#scans-results').empty();
						table = json_tableify(msg.data);
						$(table).addClass('table table-striped');
						$('#scans-results').append(table);
					},
					error: function(xhr, status, error){
						response = JSON.parse(xhr.responseText);
						console.log(response);
					},
					complete: function(){
						loadUsers(++i);
					}
				});
			}
			loadUsers(0);
		},
		error: function(xhr, status, error){
			response = JSON.parse(xhr.responseText);
			$('#scans-results').html(response.data);
		}
	});
});

$('#errors-common-pull').click(function(){
	$('#errors-common-results').empty();

	$('#errors-common-pull').empty();
	$('#errors-common-pull').append('<span class="circle-white" style="display: inline-block; height: 16px; width: 16px;"></span> Loading...');

	let request = $.ajax({
		url: 'api/stats.php?stat=errors',
		method: 'GET',
		dataType: 'json',
		success: function(msg){
			let table = json_tableify(msg.data);
			$(table).addClass('table table-striped');

			$('#errors-common-results').append(table);
			$('#errors-common-csv').removeClass('hidden');
			$('#errors-common-csv').click(function(){
				tableToCSV('#errors-common-results', "UDOIT_Errors.csv");
			});

			$('#errors-common-pull').empty();
			$('#errors-common-pull').append('Update Results');
		},
		error: function(xhr, status, error){
			response = JSON.parse(xhr.responseText);
			$('#user-results').html(response.data);
		}
	});
});

$('#user-pull').click(function(){
	$('#user-results').empty();

	$('#user-pull').empty();
	$('#user-pull').append('<span class="circle-white" style="display: inline-block; height: 16px; width: 16px;"></span> Loading...');

	let request = $.ajax({
		url: 'api/users.php?action=list',
		method: 'GET',
		dataType: 'json',
		success: function(msg){
			let table = json_tableify(msg.data);
			table = addDeauthButton(msg.data, table);
			$(table).addClass('table table-striped');

			$('#user-results').append(table);
			$('#user-csv').removeClass('hidden');
			$('#user-csv').click(function(){
				tableToCSV('#user-results', "UDOIT_Users.csv");
			});

			$('#user-pull').empty();
			$('#user-pull').append('Update Results');
		},
		error: function(xhr, status, error){
			response = JSON.parse(xhr.responseText);
			$('#user-results').html(response.data);
		}
	});
});

$('#user-growth-pull').on('submit', function(evt){
	evt.preventDefault();
	let formvals = $(this).serialize();
	$('#user-growth-results').empty();

	$('#user-growth-submit').empty();
	$('#user-growth-submit').append('<span class="circle-white" style="display: inline-block; height: 16px; width: 16px;"></span> Loading...');

	let request = $.ajax({
		url: 'api/stats.php?stat=usergrowth&'+formvals,
		method: 'GET',
		dataType: 'json',
		success: function(msg){
			let table = json_tableify(msg.data);
			$(table).addClass('table table-striped');
			$('#user-growth-results').append(table);

			$('#user-growth-csv').removeClass('hidden');
			$('#user-growth-csv').click(function(){
				tableToCSV('#user-growth-results', "UDOIT_User_Growth.csv");
			});

			$('#user-growth-submit').empty();
			$('#user-growth-submit').append('Update Results');

		},
		error: function(xhr, status, error){
			response = JSON.parse(xhr.responseText);
			$('#user-growth-results').html(response.data);
		}
	});
});

$(document).ready(function(){
	let request = $.ajax({
		url: 'api/stats.php?stat=termslist',
		method: 'GET',
		dataType: 'json',
		success: function(msg){
			$.each(msg.data, function(i, term){
				let option = document.createElement('option');
				option.innerHTML = term.name;
				option.value = term.id;
				$('#scans-term-id').append(option);
			});
		},
		error: function(xhr, status, error){
			response = JSON.parse(xhr.responseText);
			$('#scans-term-id').html(response.data);
		}
	});
});