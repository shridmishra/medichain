import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Sora font links removed, will be handled by next/font */}
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
