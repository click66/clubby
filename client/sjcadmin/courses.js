import { Modal } from 'bootstrap';
import { postJson, postNone } from './js/_networking';

const mdlCourse = new Modal(document.getElementById('mdlCourse'));
const btnNewCourse = document.getElementById('btnNewCourse');
const btnMdlCourseCancel = document.getElementById('mdlCourse_cancel');
const btnCourseRemove = document.querySelectorAll('.btnCourseRemove');
const frmCourse = document.getElementById('frmCourse');

btnNewCourse.addEventListener('click', function () {
    mdlCourse.show();
})

btnMdlCourseCancel.addEventListener('click', function () {
    mdlCourse.hide();
});

frmCourse.addEventListener('submit', function (e) {
    let fd = new FormData(frmCourse),
        post = postJson(fd.get('csrfmiddlewaretoken'), {
            'courseName': fd.get('courseName'),
            'courseDay': fd.getAll('courseDay'),
        });
    e.preventDefault();

    post('/api/courses/add').then(function () {
        location.reload();
    });
});

btnCourseRemove.forEach(function (btn) {
    btn.addEventListener('click', function (e) {
        e.preventDefault();
        if (confirm('Confirm removal of course? This will remove all attendance records for this course, and all students will be unassigned.')) {
            postNone(btn.dataset.csrfToken)('/api/courses/delete/' + btn.dataset.uuid).then(function () {
                location.reload();
            })
        }
    });
});
