import { Field, Form, Formik } from 'formik'
import { useContext, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { UserContext } from '../../contexts/UserContext'
import { authentication } from '../../authentication'

export default function Login() {
    const location = useLocation()
    const navigate = useNavigate()
    const state = location.state
    const [_, setUser] = useContext(UserContext)
    const [error, setError] = useState<Error | null>(null)

    return (
        <>
            {error !== null ? (
                <div className="p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50 w-full" role="alert">
                    <div className="font-medium">Registration failed</div>
                    <div>{error.message}</div>
                </div>
            ) : ''}
            {state?.activationSuccess === true ?
                <div className="p-4 mb-4 text-sm text-green-800 rounded-lg bg-green-50 w-full" role="alert">
                    <div className="font-medium">Account Activation Successful!</div>
                    <div>Please sign in to access your account.</div>
                </div>
                : ''}
            <div className="flex items-center justify-center">
                <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
                    <h2 className="text-2xl font-semibold mb-6 text-center">Login</h2>

                    <Formik
                        initialValues={{
                            'email': '',
                            'password': '',
                        }}
                        onSubmit={(values, { setSubmitting }) => {
                            setSubmitting(true)
                            authentication.login(values)
                                .then((user) => {
                                    setUser(user)
                                    navigate('/')
                                })
                                .catch(setError)
                                .finally(() => { setSubmitting(false) })
                        }}
                    >
                        {({ isSubmitting }) => (
                            <Form>
                                <div className="mb-4">
                                    <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2">
                                        Email
                                    </label>
                                    <Field
                                        type="email"
                                        id="email"
                                        name="email"
                                        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:border-primary"
                                        validate={(value: string) => value === '' ? 'Required' : null}
                                        required
                                    />
                                </div>

                                <div className="mb-4">
                                    <label htmlFor="password" className="block text-gray-700 text-sm font-bold mb-2">
                                        Password
                                    </label>
                                    <Field
                                        type="password"
                                        id="password"
                                        name="password"
                                        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:border-primary"
                                        validate={(value: string) => value === '' ? 'Required' : null}
                                        required
                                    />
                                </div>

                                <div className="mb-4 text-right">
                                    <a href="#" className="text-primary text-sm">
                                        Forgot Password?
                                    </a>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full bg-primary text-white p-3 rounded-md focus:outline-none focus:shadow-outline-blue"
                                >
                                    Sign In
                                </button>
                            </Form>
                        )}
                    </Formik>

                    <div className="mt-6 flex justify-between items-center">
                        <Link to="/auth/register" className="text-sm text-primary">
                            First time? Register!
                        </Link>
                        <Link to="/login-with-google" className="text-sm text-primary">
                            Login with Google
                        </Link>
                    </div>
                </div>
            </div>
        </>
    )
}
