import DataTable from 'datatables.net';
import mqa from './js/_member_quickadd';
import membershipBadge from './js/_membership_badge';
import { Badges } from './js/_helpers';


const badges = new Badges(document);

const mBadgeRenderer = (d, t, r) => membershipBadge(document)(badges, r).outerHTML;

const table = new DataTable('#tblStudents .table', {
    ajax: {
        url: "/api/members",
        dataSrc: "",
    },
    columns: [
        { "data": "name", "className": "studentName" },
        { "data": "membership", "render": mBadgeRenderer, "className": "studentMembership" },
    ],
    paging: false,
    scrollX: true,
    scrollCollapse: true,
});

table.table().container().querySelector('.dataTables_filter')
    .prepend(document.querySelector('#tblStudents_buttons'));

table.on('click', 'td', function (e) {
    let row = table.row(this),
        data = row.data();

    location.href = '/members/' + data.uuid + '#profile';
});

mqa(document, table);