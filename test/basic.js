/* eslint-env mocha */

const multerS3 = require('../')

const fs = require('fs')
const path = require('path')
const extend = require('xtend')
const assert = require('assert')
const multer = require('multer')
const stream = require('stream')
const FormData = require('form-data')
const onFinished = require('on-finished')
const mockS3 = require('./util/mock-s3.js')

const VALID_OPTIONS = {
  bucket: 'string'
}

const INVALID_OPTIONS = [
  ['numeric key', { key: 1337 }],
  ['string key', { key: 'string' }],
  ['numeric bucket', { bucket: 1337 }],
  ['numeric contentType', { contentType: 1337 }]
]

function submitForm (multer, form, cb) {
  form.getLength(function (err, length) {
    if (err) return cb(err)

    const req = new stream.PassThrough()

    req.complete = false
    form.once('end', function () {
      req.complete = true
    })

    form.pipe(req)
    req.headers = {
      'content-type': 'multipart/form-data; boundary=' + form.getBoundary(),
      'content-length': length
    }

    multer(req, null, function (err) {
      onFinished(req, function () { cb(err, req) })
    })
  })
}

describe('Multer S3', function () {
  it('is exposed as a function', function () {
    assert.equal(typeof multerS3, 'function')
  })

  INVALID_OPTIONS.forEach(function (testCase) {
    it('throws when given ' + testCase[0], function () {
      function testBody () {
        multerS3(extend(VALID_OPTIONS, testCase[1]))
      }

      assert.throws(testBody, TypeError)
    })
  })

  it('upload files', function (done) {
    const s3 = mockS3()
    const form = new FormData()
    const storage = multerS3({ s3, bucket: 'test', key: 'mock-location' })
    const upload = multer({ storage })
    const parser = upload.single('image')
    const image = fs.createReadStream(path.join(__dirname, 'files', 'ffffff.png'))

    form.append('name', 'Multer')
    form.append('image', image)

    submitForm(parser, form, function (err, req) {
      assert.ifError(err)

      assert.equal(req.body.name, 'Multer')

      assert.equal(req.file.fieldname, 'image')
      assert.equal(req.file.originalname, 'ffffff.png')
      assert.equal(req.file.size, 68)
      assert.equal(req.file.bucket, 'test')
      assert.equal(req.file.etag, 'mock-etag')
      assert.equal(req.file.location, 'https//test.hostname/mock-location')

      done()
    })
  })

  it('uploads file with AES256 server-side encryption', function (done) {
    const s3 = mockS3()
    const form = new FormData()
    const storage = multerS3({ s3, bucket: 'test', key: 'mock-location', serverSideEncryption: 'AES256' })
    const upload = multer({ storage })
    const parser = upload.single('image')
    const image = fs.createReadStream(path.join(__dirname, 'files', 'ffffff.png'))

    form.append('name', 'Multer')
    form.append('image', image)

    submitForm(parser, form, function (err, req) {
      assert.ifError(err)

      assert.equal(req.body.name, 'Multer')

      assert.equal(req.file.fieldname, 'image')
      assert.equal(req.file.originalname, 'ffffff.png')
      assert.equal(req.file.size, 68)
      assert.equal(req.file.bucket, 'test')
      assert.equal(req.file.etag, 'mock-etag')
      assert.equal(req.file.location, 'https//test.hostname/mock-location')
      assert.equal(req.file.serverSideEncryption, 'AES256')

      done()
    })
  })

  it('uploads file with AWS KMS-managed server-side encryption', function (done) {
    const s3 = mockS3()
    const form = new FormData()
    const storage = multerS3({ s3, bucket: 'test', key: 'mock-location', serverSideEncryption: 'aws:kms' })
    const upload = multer({ storage })
    const parser = upload.single('image')
    const image = fs.createReadStream(path.join(__dirname, 'files', 'ffffff.png'))

    form.append('name', 'Multer')
    form.append('image', image)

    submitForm(parser, form, function (err, req) {
      assert.ifError(err)

      assert.equal(req.body.name, 'Multer')

      assert.equal(req.file.fieldname, 'image')
      assert.equal(req.file.originalname, 'ffffff.png')
      assert.equal(req.file.size, 68)
      assert.equal(req.file.bucket, 'test')
      assert.equal(req.file.etag, 'mock-etag')
      assert.equal(req.file.location, 'https//test.hostname/mock-location')
      assert.equal(req.file.serverSideEncryption, 'aws:kms')

      done()
    })
  })

  it('uploads PNG file with correct content-type', function (done) {
    const s3 = mockS3()
    const form = new FormData()
    const storage = multerS3({ s3, bucket: 'test', key: 'mock-location', serverSideEncryption: 'aws:kms', contentType: multerS3.AUTO_CONTENT_TYPE })
    const upload = multer({ storage })
    const parser = upload.single('image')
    const image = fs.createReadStream(path.join(__dirname, 'files', 'ffffff.png'))

    form.append('name', 'Multer')
    form.append('image', image)

    submitForm(parser, form, function (err, req) {
      assert.ifError(err)

      assert.equal(req.body.name, 'Multer')

      assert.equal(req.file.fieldname, 'image')
      assert.equal(req.file.contentType, 'image/png')
      assert.equal(req.file.originalname, 'ffffff.png')
      assert.equal(req.file.size, 68)
      assert.equal(req.file.bucket, 'test')
      assert.equal(req.file.etag, 'mock-etag')
      assert.equal(req.file.location, 'https//test.hostname/mock-location')
      assert.equal(req.file.serverSideEncryption, 'aws:kms')

      done()
    })
  })

  it('uploads pure SVG file with correct content-type', function (done) {
    const s3 = mockS3()
    const form = new FormData()
    const storage = multerS3({ s3, bucket: 'test', key: 'mock-location', serverSideEncryption: 'aws:kms', contentType: multerS3.AUTO_CONTENT_TYPE })
    const upload = multer({ storage })
    const parser = upload.single('image')
    const image = fs.createReadStream(path.join(__dirname, 'files', 'test.svg'))

    form.append('name', 'Multer')
    form.append('image', image)

    submitForm(parser, form, function (err, req) {
      assert.ifError(err)

      assert.equal(req.body.name, 'Multer')

      assert.equal(req.file.fieldname, 'image')
      assert.equal(req.file.contentType, 'image/svg+xml')
      assert.equal(req.file.originalname, 'test.svg')
      assert.equal(req.file.size, 100)
      assert.equal(req.file.bucket, 'test')
      assert.equal(req.file.etag, 'mock-etag')
      assert.equal(req.file.location, 'https//test.hostname/mock-location')
      assert.equal(req.file.serverSideEncryption, 'aws:kms')

      done()
    })
  })

  it('uploads common SVG file with correct content-type', function (done) {
    const s3 = mockS3()
    const form = new FormData()
    const storage = multerS3({ s3, bucket: 'test', key: 'mock-location', serverSideEncryption: 'aws:kms', contentType: multerS3.AUTO_CONTENT_TYPE })
    const upload = multer({ storage })
    const parser = upload.single('image')
    const image = fs.createReadStream(path.join(__dirname, 'files', 'test2.svg'))

    form.append('name', 'Multer')
    form.append('image', image)

    submitForm(parser, form, function (err, req) {
      assert.ifError(err)

      assert.equal(req.body.name, 'Multer')

      assert.equal(req.file.fieldname, 'image')
      assert.equal(req.file.contentType, 'image/svg+xml')
      assert.equal(req.file.originalname, 'test2.svg')
      assert.equal(req.file.size, 285)
      assert.equal(req.file.bucket, 'test')
      assert.equal(req.file.etag, 'mock-etag')
      assert.equal(req.file.location, 'https//test.hostname/mock-location')
      assert.equal(req.file.serverSideEncryption, 'aws:kms')

      done()
    })
  })

  it('uploads SVG file without quadratic regex', function (done) {
    this.timeout('10s')

    const s3 = mockS3()
    const form = new FormData()
    const storage = multerS3({ s3, bucket: 'test', key: 'mock-location', serverSideEncryption: 'aws:kms', contentType: multerS3.AUTO_CONTENT_TYPE })
    const upload = multer({ storage })
    const parser = upload.single('image')
    fs.writeFileSync(path.join(__dirname, 'files', 'test_generated.svg'), '<!doctype svg ' + ' '.repeat(34560))
    const image = fs.createReadStream(path.join(__dirname, 'files', 'test_generated.svg'))

    form.append('name', 'Multer')
    form.append('image', image)

    submitForm(parser, form, function (err, req) {
      assert.ifError(err)

      assert.equal(req.body.name, 'Multer')

      assert.equal(req.file.fieldname, 'image')
      assert.equal(req.file.contentType, 'application/octet-stream')
      assert.equal(req.file.originalname, 'test_generated.svg')
      assert.equal(req.file.size, 34574)
      assert.equal(req.file.bucket, 'test')
      assert.equal(req.file.etag, 'mock-etag')
      assert.equal(req.file.location, 'https//test.hostname/mock-location')
      assert.equal(req.file.serverSideEncryption, 'aws:kms')

      done()
    })
  })

  it('uploads common file as gzip content encoded', function (done) {
    const s3 = mockS3()
    const form = new FormData()
    const storage = multerS3({ s3, bucket: 'test', key: 'mock-location', serverSideEncryption: 'aws:kms', contentType: multerS3.AUTO_CONTENT_TYPE, contentEncoding: 'gzip' })
    const upload = multer({ storage })
    const parser = upload.single('file')
    const image = fs.createReadStream(path.join(__dirname, 'files', 'a.txt'))

    form.append('name', 'Multer')
    form.append('file', image)

    submitForm(parser, form, function (err, req) {
      assert.ifError(err)

      assert.equal(req.body.name, 'Multer')
      assert.equal(req.file.fieldname, 'file')
      assert.equal(req.file.contentType, 'application/octet-stream')
      assert.equal(req.file.originalname, 'a.txt')
      assert.equal(req.file.size, 7)
      assert.equal(req.file.bucket, 'test')
      assert.equal(req.file.etag, 'mock-etag')
      assert.equal(req.file.location, 'https//test.hostname/mock-location')
      assert.equal(req.file.serverSideEncryption, 'aws:kms')
      assert.equal(req.file.contentEncoding, 'gzip')
      done()
    })
  })

  it('uploads PNG file with transformers', function (done) {
    const s3 = mockS3()
    const form = new FormData()
    const storage = multerS3({
      s3,
      bucket: 'test',
      contentType: multerS3.AUTO_CONTENT_TYPE,
      shouldTransform: true,
      transformers: [
        {
          id: 'original',
          key: 'original',
          transform: function (req, file, cb) {
            cb(null, new stream.PassThrough())
          }
        },
        {
          id: 'thumbnail',
          key: function (req, file, cb) {
            cb(null, 'thumbnail')
          },
          transform: function (req, file, cb) {
            cb(null, new stream.PassThrough())
          },
          contentType: 'image/webp'
        }
      ]
    })
    const upload = multer({ storage })
    const parser = upload.single('image')
    const image = fs.createReadStream(path.join(__dirname, 'files', 'ffffff.png'))

    form.append('name', 'Multer')
    form.append('image', image)

    submitForm(parser, form, function (err, req) {
      assert.ifError(err)

      assert.equal(req.body.name, 'Multer')

      assert.equal(req.file.fieldname, 'image')
      assert.equal(req.file.mimetype, 'image/png')
      assert.equal(req.file.originalname, 'ffffff.png')
      assert.equal(req.file.transformations.original.size, 68)
      assert.equal(req.file.transformations.original.bucket, 'test')
      assert.equal(req.file.transformations.original.etag, 'mock-etag')
      assert.equal(req.file.transformations.original.location, 'https//test.hostname/original')
      assert.equal(req.file.transformations.original.contentType, 'image/png')
      assert.equal(req.file.transformations.thumbnail.size, 68)
      assert.equal(req.file.transformations.thumbnail.bucket, 'test')
      assert.equal(req.file.transformations.thumbnail.etag, 'mock-etag')
      assert.equal(req.file.transformations.thumbnail.location, 'https//test.hostname/thumbnail')
      assert.equal(req.file.transformations.thumbnail.contentType, 'image/webp')

      done()
    })
  })

  it('uploads a PNG and SVG file with transforms', function (done) {
    const s3 = mockS3()
    const form = new FormData()
    const storage = multerS3({
      s3,
      bucket: 'test',
      contentType: multerS3.AUTO_CONTENT_TYPE,
      shouldTransform: true,
      transformers: [
        {
          id: 'original',
          key: 'original',
          transform: function (req, file, cb) {
            cb(null, new stream.PassThrough())
          }
        },
        {
          id: 'thumbnail',
          key: function (req, file, cb) {
            cb(null, 'thumbnail')
          },
          transform: function (req, file, cb) {
            cb(null, new stream.PassThrough())
          }
        }
      ]
    })
    const upload = multer({ storage })
    const parser = upload.array('images', 2)
    const image1 = fs.createReadStream(path.join(__dirname, 'files', 'ffffff.png'))
    const image2 = fs.createReadStream(path.join(__dirname, 'files', 'test2.svg'))

    form.append('name', 'Multer')
    form.append('images', image1)
    form.append('images', image2)

    submitForm(parser, form, function (err, req) {
      assert.ifError(err)

      assert.equal(req.body.name, 'Multer')

      assert.equal(req.files[0].fieldname, 'images')
      assert.equal(req.files[0].mimetype, 'image/png')
      assert.equal(req.files[0].originalname, 'ffffff.png')
      assert.equal(req.files[0].transformations.original.size, 68)
      assert.equal(req.files[0].transformations.original.bucket, 'test')
      assert.equal(req.files[0].transformations.original.etag, 'mock-etag')
      assert.equal(req.files[0].transformations.original.location, 'https//test.hostname/original')
      assert.equal(req.files[0].transformations.thumbnail.size, 68)
      assert.equal(req.files[0].transformations.thumbnail.bucket, 'test')
      assert.equal(req.files[0].transformations.thumbnail.etag, 'mock-etag')
      assert.equal(req.files[0].transformations.thumbnail.location, 'https//test.hostname/thumbnail')

      assert.equal(req.files[1].fieldname, 'images')
      assert.equal(req.files[1].mimetype, 'image/svg+xml')
      assert.equal(req.files[1].originalname, 'test2.svg')

      done()
    })
  })

  it('uploads a PNG and SVG file', function (done) {
    const s3 = mockS3()
    const form = new FormData()
    const storage = multerS3({
      s3,
      bucket: 'test',
      key: 'mock-location',
      contentType: multerS3.AUTO_CONTENT_TYPE
    })
    const upload = multer({ storage })
    const parser = upload.array('images', 2)
    const image1 = fs.createReadStream(path.join(__dirname, 'files', 'ffffff.png'))
    const image2 = fs.createReadStream(path.join(__dirname, 'files', 'test2.svg'))

    form.append('name', 'Multer')
    form.append('images', image1)
    form.append('images', image2)

    submitForm(parser, form, function (err, req) {
      assert.ifError(err)

      assert.equal(req.body.name, 'Multer')

      assert.equal(req.files[0].fieldname, 'images')
      assert.equal(req.files[0].mimetype, 'image/png')
      assert.equal(req.files[0].originalname, 'ffffff.png')
      assert.equal(req.files[0].size, 68)
      assert.equal(req.files[0].bucket, 'test')
      assert.equal(req.files[0].etag, 'mock-etag')
      assert.equal(req.files[0].location, 'https//test.hostname/mock-location')

      assert.equal(req.files[1].fieldname, 'images')
      assert.equal(req.files[1].mimetype, 'image/svg+xml')
      assert.equal(req.files[1].originalname, 'test2.svg')
      assert.equal(req.files[1].size, 285)
      assert.equal(req.files[1].bucket, 'test')
      assert.equal(req.files[1].etag, 'mock-etag')
      assert.equal(req.files[1].location, 'https//test.hostname/mock-location')

      done()
    })
  })
})
