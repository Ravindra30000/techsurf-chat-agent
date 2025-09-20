import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { terser } from '@rollup/plugin-terser';

const production = !process.env.ROLLUP_WATCH;

export default [
  {
    input: 'src/index.ts',
    output: [
      {
        file: 'dist/index.js',
        format: 'cjs',
        sourcemap: !production
      },
      {
        file: 'dist/index.esm.js',
        format: 'esm',
        sourcemap: !production
      }
    ],
    plugins: [
      resolve(),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json'
      }),
      production && terser()
    ].filter(Boolean)
  },
  
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/techsurf-chat.min.js',
      format: 'umd',
      name: 'TechSurfChat',
      sourcemap: !production
    },
    plugins: [
      resolve(),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json'
      }),
      production && terser()
    ].filter(Boolean)
  }
];
