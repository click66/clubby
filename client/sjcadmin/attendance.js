import DataTable from 'datatables.net';
import { Modal } from 'bootstrap';
import mqa from './js/_member_quickadd';
import membershipBadge from './js/_membership_badge';
import { postJson } from './js/_networking';
import { Notifications, notifyError } from './js/_notifications';
import { Icons, Badges, withChild, withClasses } from './js/_helpers';


const icons = new Icons(document);
const badges = new Badges(document);
const notifications = new Notifications(document);

const mBadgeRenderer = (d, t, r) => membershipBadge(document)(badges, r).outerHTML;

const attendanceBadge = r => date => {
    let paid = r.paid.includes(date),
        complementary = r.complementary.includes(date);

    if (paid || complementary) {
        return withChild(
            withChild(badges.primary(), icons.make('check', ['fs-8', 'me-1'])),
            document.createTextNode(paid ? 'Paid' : 'Free'))
            .outerHTML;
    }

    return withChild(badges.secondary(), document.createTextNode('Attending')).outerHTML;
}

const studentClassAttendance = date => (m, t, r) => {
    return r.attendances.includes(date) ? attendanceBadge(r)(date) : '';
}

const dataClasses = JSON.parse(document.getElementById('dataClasses').textContent);
const dataCourses = JSON.parse(document.getElementById('dataCourses').textContent);

const details = row => {
    let list = withClasses(document.createElement('ul'), ['details']),
        li = (l, c) => {
            let r = document.createElement('li'),
                el = document.createElement('label');
            el.appendChild(document.createTextNode(l + ': '));
            r.appendChild(el);
            r.appendChild(document.createTextNode(c));
            return r;
        },
        manageLink = uuid => {
            let i = icons.make('box-arrow-up-right'),
                a = document.createElement('a');

            a.appendChild(i);
            a.appendChild(document.createTextNode(' Manage'));
            a.setAttribute('href', '/members/' + uuid + '#profile');
            return a;
        };

    switch (row['membership']) {
        case 'licenced':
            list.appendChild(li('Licence No.', row['licence']['no']));
            list.appendChild(li('Licence Expires', row['licence']['exp_time']));
            break;
        case 'trial':
            list.appendChild(li('Remaining Trial Sessions', row['rem_trial_sessions']));
    }

    list.appendChild(manageLink(row.uuid));

    return list;
}

const boundAttendanceHandler = function (mdlHtml, table) {
    const mdlAttendance = new Modal(mdlHtml),
        frmAttendance = mdlHtml.querySelector('#frmAttendance'),
        btnMdlAttendanceCancel = mdlHtml.querySelector('#mdlAttendance_cancel'),
        eByPrefix = p => mdlHtml.querySelector(`#mdlAttendance_${p}`),
        eProductUuid = eByPrefix('productUuid'),
        eProductLabel = eByPrefix('productLabel'),
        eSessionDate = eByPrefix('sessionDate'),
        eStudentUuid = eByPrefix('studentUuid'),
        eStudentName = eByPrefix('studentName'),
        eAttending = eByPrefix('attending'),
        eComplementary = eByPrefix('complementary'),
        ePaid = eByPrefix('paid'),
        ePayOptions = eByPrefix('payOptions'),
        ePayOption = eByPrefix('payOption'),
        rowRefresh = function (studentUuid, data) {
            let row = table.row(`[data-student-uuid=${studentUuid}]`)
            if (row) {
                row.data(data);
                return;
            }
            table.ajax.reload();
        }

    btnMdlAttendanceCancel.addEventListener('click', function () {
        mdlAttendance.hide();
    });

    frmAttendance.addEventListener('submit', function (e) {
        if (e.submitter) {
            let submitter = e.submitter.id,
                fd = new FormData(frmAttendance),
                post = postJson(fd.get('csrfmiddlewaretoken'), Object.fromEntries(fd.entries()));
            e.preventDefault();

            switch (submitter) {
                case 'mdlAttendance_submit':
                    post('/api/attendance/log').then(function (r) {
                        notifications.success('Attendance recorded');
                        rowRefresh(r.success.uuid, r.success);
                        mdlAttendance.hide();
                    }).catch(notifyError(notifications));
                    break;
                case 'mdlAttendance_clear':
                    post('/api/attendance/clear').then(function (r) {
                        notifications.success('Attendance cleared');
                        rowRefresh(r.success.uuid, r.success);
                        mdlAttendance.hide();
                    }).catch(notifyError(notifications));
                    break;
            }
        }
    });

    [...mdlHtml.querySelectorAll('input[name=payment]')].forEach(function (r) {
        r.addEventListener('change', function (e) {
            mdlHtml.querySelector('#mdlAttendance_payOptions').classList.toggle('d-none', e.target.value != 'paid');
        });
    });

    return function (e) {
        if (e.target.matches('td.session, td.session *')) {
            let td = e.target.closest('td'),
                cell = table.cell(td).node(),
                date = cell.getAttribute('data-sessdate'),
                productUuid = cell.getAttribute('data-product'),
                productName = dataCourses[productUuid],
                row = table.row(td),
                rd = row.data(),
                attending = rd.attendances.includes(date),
                complementary = rd.complementary.includes(date),
                paid = rd.paid.includes(date),
                prepaid = rd.prepayments[productUuid];

            eSessionDate.value = date;
            eProductUuid.value = productUuid;
            eStudentUuid.value = rd.uuid;
            eStudentName.value = rd.name;
            eProductLabel.textContent = productName;

            eAttending.checked = attending;
            eComplementary.checked = complementary;
            ePaid.checked = paid;

            eAttending.disabled = paid;
            eComplementary.disabled = paid;
            ePaid.disabled = paid;

            ePayOptions.classList.toggle('d-none', true);
            ePayOption.value = prepaid ? 'advance' : 'now';

            mdlAttendance.show();
        }
    }
}

const table = new DataTable('#tblStudents .table', {
    ajax: {
        url: "/api/attendance",
        dataSrc: "",
    },
    columns: [
        {
            "data": "name", "className": "studentName", "render": function (d, m, r) {
                let c = withClasses(document.createElement('span'), ['d-flex', 'justify-content-between']),
                    sn = document.createElement('span'),
                    ac = withClasses(document.createElement('a'), ['ps-2']),
                    bc = withClasses(document.createElement('a'), ['ps-2']);

                sn.appendChild(document.createTextNode(d));
                c.appendChild(sn);

                if (Object.values(r.prepayments).some(b => b === true)) {
                    bc.setAttribute('href', '/members/' + r.uuid + '#payments');
                    bc.appendChild(icons.make('cash'));
                    c.appendChild(bc);
                }

                return c.outerHTML;
            }
        },
        { "data": "membership", "render": mBadgeRenderer, "className": "studentMembership" },
    ].concat(Object.keys(dataClasses).map(function (k) {
        return {
            "className": "session",
            "createdCell": (td, cd, rd, r, co) => {
                const expired = (rd.membership === 'licenced' && rd.licence.exp) ||
                    (rd.membership === 'trial' && rd.rem_trial_sessions <= 0);
                if (expired) {
                    td.className += ' disabled';
                }

                const availableCourses = dataClasses[k].filter(x => rd.signed_up_for.includes(x));
                td.setAttribute('data-sessdate', k);
                td.setAttribute('data-product', availableCourses);

                if (!availableCourses.length) {
                    td.className += ' disabled';
                }
            },
            "data": null,
            "orderable": false,
            "render": studentClassAttendance(k),
        }
    })),
    createdRow: function (row, data) {
        row.setAttribute('data-student-uuid', data.uuid);
    },
    paging: false,
    scrollX: true,
    scrollCollapse: true,
});

table.table().container().querySelector('.dataTables_filter')
    .prepend(document.querySelector('#tblStudents_buttons'));


table.table().container().addEventListener('click', function (e) {
    if (e.target && e.target.matches('.studentName, .studentName *, .studentMembership, .studentMembership *')) {
        if (e.target.matches('a, a *')) {
            e.stopPropagation();
            return;
        }

        let row = table.row(e.target.closest('td')),
            data = row.data();

        if (row.child.isShown()) {
            row.child.hide();
            return;
        }

        row.child(details(data)).show();
    }
});

table.table().container().addEventListener('click', boundAttendanceHandler(
    document.getElementById('mdlAttendance'),
    table,
));

mqa(document, table);
