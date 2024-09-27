import React from 'react';
import Link from 'next/link';

const License = () => {

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 bg-gray-900 text-white">
      <h1 className="text-3xl font-bold text-center mb-6">MIT License</h1>
      
      <p className="mb-4">
      © 2024 ioPlasmaVerse. All rights reserved.
      </p>
      
      <p className="mb-4">
        Permission is hereby granted, free of charge, to any person obtaining a copy
        of this software and associated documentation files (the &quot;Software&quot;), to deal
        in the Software without restriction, including without limitation the rights
        to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
        copies of the Software, and to permit persons to whom the Software is
        furnished to do so, subject to the following conditions:
      </p>
      
      <p className="mb-4">
        The above copyright notice and this permission notice shall be included in all
        copies or substantial portions of the Software.
      </p>
      
      <p className="mb-4">
        THE SOFTWARE IS PROVIDED &quot;AS IS&quot;, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
        IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
        FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
        AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
        LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
        OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
        SOFTWARE.
      </p>

      <div className="mt-8 text-center">
        <a href='/' className="link link-hover px-5 py-2 border border-sky-500 border-opacity-20 rounded-full">Home</a>
      </div>
    </div>
  );
};

export default License;
