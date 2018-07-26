/**
 * <js-timestamp>
 * -----------------------------------------------------------------------------
 * A human-readable, self-updating "timeago" timestamp, with some special rules:
 *
 * • Within 24 hours, displays in "timeago" format.
 * • Within a month, displays month, day, and time of day.
 * • Within a year, displays just the month and day.
 * • Older than that, displays the month and day with the full year.
 *
 * @type {Component}
 * -----------------------------------------------------------------------------
 */

parasails.registerComponent('jsTimestamp', {

  //  ╔═╗╦═╗╔═╗╔═╗╔═╗
  //  ╠═╝╠╦╝║ ║╠═╝╚═╗
  //  ╩  ╩╚═╚═╝╩  ╚═╝
  props: [
    'at',// « The JS timestamp to format
    'short',// « Whether to shorten the formatted date by not including the time of day (only applicable for timeago)
    'format',// « one of: 'calendar', 'timeago' (defaults to 'timeago')
  ],

  //  ╦╔╗╔╦╔╦╗╦╔═╗╦    ╔═╗╔╦╗╔═╗╔╦╗╔═╗
  //  ║║║║║ ║ ║╠═╣║    ╚═╗ ║ ╠═╣ ║ ║╣
  //  ╩╝╚╝╩ ╩ ╩╩ ╩╩═╝  ╚═╝ ╩ ╩ ╩ ╩ ╚═╝
  data: function (){
    return {
      formatType: undefined,
      formattedTimestamp: '',
      interval: undefined
    };
  },

  //  ╦ ╦╔╦╗╔╦╗╦
  //  ╠═╣ ║ ║║║║
  //  ╩ ╩ ╩ ╩ ╩╩═╝
  template: `
  <span>{{formattedTimestamp}}</span>
  `,

  //  ╦  ╦╔═╗╔═╗╔═╗╦ ╦╔═╗╦  ╔═╗
  //  ║  ║╠╣ ║╣ ║  ╚╦╝║  ║  ║╣
  //  ╩═╝╩╚  ╚═╝╚═╝ ╩ ╚═╝╩═╝╚═╝
  beforeMount: function() {
    if (this.at === undefined) {
      throw new Error('Incomplete usage of <js-timestamp>:  Please specify `at` as a JS timestamp (i.e. epoch ms, a number).  For example: `<js-timestamp :at="something.createdAt">`');
    }
    if(this.format === undefined) {
      this.formatType = 'timeago';
    } else  {
      if(!_.contains(['calendar', 'timeago'], this.format)) { throw new Error('Unsupported `format` ('+this.format+') passed in to the JS timestamp component! Must be either \'calendar\' or \'timeago\'.'); }
      this.formatType = this.format;
    }

    // If timeago timestamp, update the timestamp every minute.
    if(this.formatType === 'timeago') {
      this._formatTimeago();
      this.interval = setInterval(async()=>{
        try {
          this._formatTimeago();
          await this.forceRender();
        } catch (err) {
          err.raw = err;
          throw new Error('Encountered unexpected error while attempting to automatically re-render <js-timestamp> in the background, as the seconds tick by.  '+err.message);
        }
      },60*1000);//œ
    }

    // If calendar timestamp, just set it the once.
    if(this.formatType === 'calendar') {
      this.formattedTimestamp = moment(this.at).format('MM-DD-YYYY');
    }
  },

  beforeDestroy: function() {
    if(this.formatType === 'timeago') {
      clearInterval(this.interval);
    }
  },

  //  ╦╔╗╔╔╦╗╔═╗╦═╗╔═╗╔═╗╔╦╗╦╔═╗╔╗╔╔═╗
  //  ║║║║ ║ ║╣ ╠╦╝╠═╣║   ║ ║║ ║║║║╚═╗
  //  ╩╝╚╝ ╩ ╚═╝╩╚═╩ ╩╚═╝ ╩ ╩╚═╝╝╚╝╚═╝
  methods: {

    _formatTimeago: function() {
      var now = new Date().getTime();
      var timeDifference = now - this.at;

      // If the timestamp is less than a day old, format as time ago.
      if(timeDifference < 1000*60*60*24) {
        this.formattedTimestamp = moment(this.at).fromNow();
      } else {
        // If the timestamp is less than a month-ish old, we'll include the
        // time of day in the formatted timestamp.
        var includeTime = !this.short && timeDifference < 1000*60*60*24*31;

        // If the timestamp is from a different year, we'll include the year
        // in the formatted timestamp.
        var includeYear = moment(now).format('YYYY') !== moment(this.at).format('YYYY');

        this.formattedTimestamp = moment(this.at).format('MMMM DD'+(includeYear ? ' YYYY' : '')+(includeTime ? ' [at] h:mma' : ''));
      }

    }

  }

});