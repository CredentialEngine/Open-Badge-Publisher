
export const haveSameDomain = (url1: string, url2: string, default_domain='https://sandbox.credentialengine.org'): Boolean => {
    try {
        const url_one = new URL(url1, default_domain)
        const url_two = new URL(url2, default_domain)

        return url_one.hostname == url_two.hostname && url_one.port == url_two.port
    }
    catch (e) {
        return false
    }
}
