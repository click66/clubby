const membershipBadge = (m, t, r) => {
    const expired = sb => {
        sb.classList.add('bg-danger');
        sb.textContent = 'Expired';
        return sb.outerHTML;
    }

    let b = document.createElement('span');
    b.classList.add('badge');
    switch(m) {
        case 'licenced':
            if (r.licence.exp) {
                return expired(b);
            }
            b.classList.add('bg-success');
            b.textContent = 'Licenced';
            return b.outerHTML;
        case 'trial':
            if (r.rem_trial_sessions <= 0) {
                return expired(b);
            }
            b.classList.add('bg-warning');
            b.classList.add('text-dark');
            b.textContent = 'Trial';
            return b.outerHTML;
    }
};

const attendanceBadge = r => date => {
    let b = document.createElement('span'),
        i = document.createElement('i'),
        paid = r.paid.includes(date),
        complementary = r.complementary.includes(date);
    b.classList.add('badge');

    if (paid || complementary) {
        i.classList.add('fs-8');
        i.classList.add('bi-check');
        i.classList.add('me-1');
        b.classList.add('bg-primary');
        b.appendChild(i);
        b.appendChild(document.createTextNode(paid ? 'Paid' : 'Free'));
        return b.outerHTML;
    }

    b.classList.add('bg-secondary');
    b.textContent = 'Attending';
    return b.outerHTML;
}

const studentClassAttendance = date => (m, t, r) => {
    return r.attendances.includes(date) ? attendanceBadge(r)(date): '';
}

const dataClasses  = JSON.parse(document.getElementById('dataClasses').textContent);

const details = row => {
    let list = document.createElement('ul'),
        li   = (l, c) => {
            let r = document.createElement('li'),
                el = document.createElement('label');
            el.appendChild(document.createTextNode(l + ': '));
            r.appendChild(el);
            r.appendChild(document.createTextNode(c));
            return r;
        },
        manageLink = uuid => {
            let i = document.createElement('i'),
                a = document.createElement('a');

            i.classList.add('bi');
            i.classList.add('bi-box-arrow-up-right');
            a.appendChild(i);
            a.appendChild(document.createTextNode(' Manage'));
            a.setAttribute('href', '/members/' + uuid);
            return a;
        };

    list.classList.add('details');

    switch(row['membership']) {
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

const table = $('#tblStudents .table').DataTable({
    ajax: {
        url: "/api/members",
        dataSrc: "",
    },
    columns: [
        {"data":"name", "className": "studentName", "render": function (d, m, r) {
            let c  = document.createElement('span'),
                sn = document.createElement('span'),
                ac = document.createElement('a'),
                ic = document.createElement('i');

            c.classList.add('d-flex', 'justify-content-between');
            sn.appendChild(document.createTextNode(d));
            c.appendChild(sn);

            if (r.has_notes) {
                ic.classList.add('bi', 'bi-chat-left-text');
                ac.classList.add('ps-2');
                ac.setAttribute('href', '/members/' + r.uuid);
                ac.appendChild(ic);
                c.appendChild(ac);
            }

            return c.outerHTML;
        }},
        {"data":"membership", "render": membershipBadge, "className": "studentMembership"},
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

        let row  = table.row(e.target.closest('td')),
            data = row.data();

        if (row.child.isShown()) {
            row.child.hide();
            return;
        }

        row.child(details(data)).show();
    }
});

const mdlAttendanceInner = document.getElementById('mdlAttendance'),
      mdlAttendance = new bootstrap.Modal(mdlAttendanceInner),
      frmAttendance = document.getElementById('frmAttendance'),
      btnMdlAttendanceCancel = document.getElementById('mdlAttendance_cancel');

table.table().container().addEventListener('click', function (e) {
    if (e.target.matches('td.session, td.session *')) {
        let td = e.target.closest('td'),
            cell = table.cell(td).node(),
            row = table.row(td).data(),
            date = cell.getAttribute('data-sessdate');

        mdlAttendanceInner.querySelector('#mdlAttendance_sessionDate').value = date;
        mdlAttendanceInner.querySelector('#mdlAttendance_studentUuid').value = row.uuid;
        mdlAttendanceInner.querySelector('#mdlAttendance_studentName').value = row.name;
        mdlAttendanceInner.querySelector('#mdlAttendance_paid').checked = row.paid.includes(date);
        mdlAttendanceInner.querySelector('#mdlAttendance_complementary').checked = row.complementary.includes(date);

        mdlAttendance.show();
    }
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
                    table.ajax.reload();
                    mdlAttendance.hide();
                }).catch(handleError);
                break;
            case 'mdlAttendance_clear':
                postForm(frmAttendance)('/api/attendance/clear').then(function (r) {
                    table.ajax.reload();
                    mdlAttendance.hide();
                }).catch(handleError);
                break;
        }
    }
});
