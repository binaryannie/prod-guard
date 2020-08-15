import './site-form.scss'
import browser from 'webextension-polyfill'
import * as WarningStyles from './warning-styles'

export default {
  name: 'SiteForm',

  props: {
    id: Number
  },

  data () {
    return {
      pattern: null,
      warningStyle: 'border'
    }
  },

  computed: {
    hasId () {
      return typeof this.id !== 'undefined'
    }
  },

  async mounted () {
    if (this.hasId) {
      const res = await browser.runtime.sendMessage({
        type: 'getSite',
        id: this.id
      })

      this.pattern = res.pattern
      this.warningStyle = res.warningStyle
    } else {
      const tabs = await browser.tabs.query({ currentWindow: true, active: true })
      if (tabs.length > 0) {
        const url = new URL(tabs[0].url)
        this.pattern = url.host.replace(/\./g, '\\.')
      }
    }
  },

  methods: {
    async handleSave (event) {
      event.preventDefault()

      const site = {
        pattern: this.pattern,
        warningStyle: this.warningStyle
      }

      if (this.hasId) {
        await browser.runtime.sendMessage({
          type: 'updateSite',
          id: this.id,
          site: site
        })
      } else {
        await browser.runtime.sendMessage({
          type: 'addSite',
          site: site
        })
      }

      this.$router.back()
    }
  },

  render () {
    const styleOptions = Object.entries(WarningStyles.names)
      .map(([key, name]) => (
        <option key={key} value={key}>{name}</option>
      ))

    return (
      <form
        class='site-form'
        onSubmit={this.handleSave}
      >
        <label class='field'>
          <span>URL Pattern:</span>
          <input
            type='text'
            required
            vModel={this.pattern}
          />
        </label>

        <p class='field-help'>
          A regular expression matched against a tab's URL.
          If there's a match, the warning is displayed.
        </p>

        <label class='field'>
          <span>Style:</span>
          <select
            required
            vModel={this.warningStyle}
          >
            {styleOptions}
          </select>
        </label>

        <p class='field-help'>
          Controls what kind of warning to display.
        </p>

        <div class='controls'>
          <button type='submit'>Save</button>
        </div>
      </form>
    )
  }
}
