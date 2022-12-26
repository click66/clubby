import DataTable from 'datatables.net';
import { Modal } from 'bootstrap';
import mqa from './js/_member_quickadd';
import membershipBadge from './js/_membership_badge';
import { postForm } from './js/_networking';
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

const table = new DataTable('#tblStudents .table', {
    ajax: {
        url: "/api/members",
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

                if (r.has_notes) {
                    ac.setAttribute('href', '/members/' + r.uuid + '#notes');
                    ac.appendChild(icons.make('chat-left-text'));
                    c.appendChild(ac);
                }

                if (r.has_prepaid) {
                    bc.setAttribute('href', '/members/' + r.uuid + '#payments');
                    bc.appendChild(icons.make('cash'));
                    c.appendChild(bc);
                }

                return c.outerHTML;
            }
        },
        { "data": "membership", "render": mBadgeRenderer, "className": "studentMembership" },
    ].concat(dataClasses.map(function (c) {
        return {
            "className": "session",
            "createdCell": (td, cd, rd, r, co) => {
                td.setAttribute('data-sessdate', c.d);
            },
            "data": null,
            "orderable": false,
            "render": studentClassAttendance(c.d),
        }
    })),
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

const mdlAttendanceInner = document.getElementById('mdlAttendance'),
    mdlAttendance = new Modal(mdlAttendanceInner),
    frmAttendance = document.getElementById('frmAttendance'),
    btnMdlAttendanceCancel = document.getElementById('mdlAttendance_cancel');

table.table().container().addEventListener('click', function (e) {
    if (e.target.matches('td.session, td.session *')) {
        let td = e.target.closest('td'),
            cell = table.cell(td).node(),
            row = table.row(td).data(),
            date = cell.getAttribute('data-sessdate'),
            attending = row.attendances.includes(date),
            complementary = row.complementary.includes(date),
            paid = row.paid.includes(date),
            prepaid = row.has_prepaid,
            eByPrefix = p => mdlAttendanceInner.querySelector(`#mdlAttendance_${p}`),
            eSessionDate = eByPrefix('sessionDate'),
            eStudentUuid = eByPrefix('studentUuid'),
            eStudentName = eByPrefix('studentName'),
            eAttending = eByPrefix('attending'),
            eComplementary = eByPrefix('complementary'),
            ePaid = eByPrefix('paid'),
            ePayOptions = eByPrefix('payOptions'),
            ePayOption = eByPrefix('payOption');

        eSessionDate.value = date;
        eStudentUuid.value = row.uuid;
        eStudentName.value = row.name;

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
});

[...mdlAttendanceInner.querySelectorAll('input[name=payment]')].forEach(function (r) {
    r.addEventListener('change', function (e) {
        mdlAttendanceInner.querySelector('#mdlAttendance_payOptions').classList.toggle('d-none', e.target.value != 'paid');
    });
});

btnMdlAttendanceCancel.addEventListener('click', function () {
    mdlAttendance.hide();
});

frmAttendance.addEventListener('submit', function (e) {
    if (e.submitter) {
        let submitter = e.submitter.id;
        e.preventDefault();

        switch (submitter) {
            case 'mdlAttendance_submit':
                postForm(frmAttendance)('/api/attendance/log').then(function (r) {
                    notifications.success('Attendance recorded');
                    table.ajax.reload();
                    mdlAttendance.hide();
                }).catch(notifyError(notifications));
                break;
            case 'mdlAttendance_clear':
                postForm(frmAttendance)('/api/attendance/clear').then(function (r) {
                    notifications.success('Attendance cleared');
                    table.ajax.reload();
                    mdlAttendance.hide();
                }).catch(notifyError(notifications));
                break;
        }
    }
});

mqa(document, table);